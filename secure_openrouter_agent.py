#!/usr/bin/env python3
"""
Production-Ready OpenRouter Agent with Secure File Editing Tools
Implements surgical editing with security hardening and robust error handling
"""

import json
import os
import pathlib
import tempfile
import shutil
from typing import Dict, List, Any, Optional
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

class SecurityError(Exception):
    """Custom exception for security-related errors"""
    pass

class FileOperationError(Exception):
    """Custom exception for file operation errors"""
    pass

class SecureFileEditingAgent:
    def __init__(self, api_key: str, workspace_root: str = None):
        """Initialize the secure OpenRouter agent with file editing capabilities"""
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        self.model = "z-ai/glm-4.5"
        self.conversation_history = []
        
        # Set up secure workspace
        if workspace_root is None:
            workspace_root = os.getcwd()
        self.workspace_root = pathlib.Path(workspace_root).resolve()
        
    def _validate_file_path(self, file_path: str) -> pathlib.Path:
        """
        Validate and secure file path to prevent path traversal attacks
        
        Args:
            file_path: The file path to validate
            
        Returns:
            Resolved and validated Path object
            
        Raises:
            SecurityError: If path is outside workspace or contains dangerous patterns
        """
        try:
            # Handle relative paths by making them relative to workspace
            if not os.path.isabs(file_path):
                # Convert relative path to absolute path within workspace
                path = (self.workspace_root / file_path).resolve()
            else:
                path = pathlib.Path(file_path).resolve()
            
            # Check if path is within workspace
            try:
                path.relative_to(self.workspace_root)
            except ValueError:
                raise SecurityError(f"Path '{file_path}' is outside the allowed workspace: {self.workspace_root}")
            
            # Check for dangerous patterns in the original file_path (before resolution)
            dangerous_patterns = [
                '../', '/etc/', '/usr/', '/var/', '/root/', '/home/',
                'passwd', 'shadow', 'hosts', '.ssh/'
            ]
            
            original_path_str = str(file_path).lower()
            for pattern in dangerous_patterns:
                if pattern in original_path_str:
                    # Allow .env.local specifically
                    if pattern == '../' and '.env.local' not in original_path_str:
                        raise SecurityError(f"Path contains potentially dangerous pattern: {pattern}")
                    elif pattern != '../':
                        raise SecurityError(f"Path contains potentially dangerous pattern: {pattern}")
            
            return path
            
        except Exception as e:
            if isinstance(e, SecurityError):
                raise
            raise SecurityError(f"Invalid file path: {str(e)}")
    
    def _handle_file_error(self, operation: str, file_path: str, error: Exception) -> str:
        """
        Handle file operation errors with structured error messages
        
        Args:
            operation: The operation being performed
            file_path: The file path involved
            error: The exception that occurred
            
        Returns:
            Structured error message
        """
        if isinstance(error, FileNotFoundError):
            return f"FileNotFoundError: Cannot {operation} '{file_path}' - file does not exist"
        elif isinstance(error, PermissionError):
            return f"PermissionError: Cannot {operation} '{file_path}' - insufficient permissions"
        elif isinstance(error, IsADirectoryError):
            return f"IsADirectoryError: Cannot {operation} '{file_path}' - path is a directory"
        elif isinstance(error, OSError):
            return f"OSError: Cannot {operation} '{file_path}' - {str(error)}"
        elif isinstance(error, SecurityError):
            return f"SecurityError: Cannot {operation} '{file_path}' - {str(error)}"
        else:
            return f"UnexpectedError: Cannot {operation} '{file_path}' - {str(error)}"
    
    def read_file_tool(self, file_path: str, start_line: Optional[int] = None, end_line: Optional[int] = None) -> str:
        """
        Read file content with optional line range and security validation
        
        Args:
            file_path: Path to the file to read
            start_line: Starting line number (1-based, optional)
            end_line: Ending line number (1-based, optional)
            
        Returns:
            File content or error message
        """
        try:
            # Validate path security
            validated_path = self._validate_file_path(file_path)
            
            # Check if file exists and is readable
            if not validated_path.exists():
                raise FileNotFoundError(f"File '{file_path}' does not exist")
            
            if not validated_path.is_file():
                raise IsADirectoryError(f"Path '{file_path}' is not a file")
            
            # Read file with encoding detection
            try:
                with open(validated_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
            except UnicodeDecodeError:
                # Try with different encoding
                with open(validated_path, 'r', encoding='latin-1') as f:
                    lines = f.readlines()
            
            # Apply line range if specified
            if start_line is not None or end_line is not None:
                total_lines = len(lines)
                start_idx = (start_line - 1) if start_line else 0
                end_idx = end_line if end_line else total_lines
                
                # Validate line ranges
                if start_idx < 0 or start_idx >= total_lines:
                    return f"Error: Start line {start_line} out of range. File has {total_lines} lines."
                if end_idx > total_lines:
                    return f"Error: End line {end_line} out of range. File has {total_lines} lines."
                
                lines = lines[start_idx:end_idx]
            
            content = ''.join(lines)
            return f"Successfully read {validated_path.name} ({len(lines)} lines)\nContent:\n{content}"
            
        except Exception as e:
            return self._handle_file_error("read", file_path, e)
    
    def create_file_tool(self, file_path: str, content: str) -> str:
        """
        Create a new file with content (fails if file already exists)
        
        Args:
            file_path: Path to the file to create
            content: Content to write to the file
            
        Returns:
            Success message or error message
        """
        try:
            # Validate path security
            validated_path = self._validate_file_path(file_path)
            
            # Check if file already exists
            if validated_path.exists():
                return f"Error: File '{file_path}' already exists. Use replace_content to modify existing files."
            
            # Create parent directories if they don't exist
            validated_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write content to file
            with open(validated_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return f"Successfully created file '{validated_path.name}' with {len(content)} characters"
            
        except Exception as e:
            return self._handle_file_error("create", file_path, e)
    
    def replace_content_tool(self, file_path: str, old_string: str, new_string: str) -> str:
        """
        Surgical replacement of specific content in a file (the scalpel approach)
        
        Args:
            file_path: Path to the file to edit
            old_string: Exact string to find and replace (including whitespace/indentation)
            new_string: String to replace it with
            
        Returns:
            Success message or error message
        """
        try:
            # Validate path security
            validated_path = self._validate_file_path(file_path)
            
            # Check if file exists
            if not validated_path.exists():
                raise FileNotFoundError(f"File '{file_path}' does not exist")
            
            # Read current content
            try:
                with open(validated_path, 'r', encoding='utf-8') as f:
                    original_content = f.read()
            except UnicodeDecodeError:
                with open(validated_path, 'r', encoding='latin-1') as f:
                    original_content = f.read()
            
            # Check if old_string exists in the file
            if old_string not in original_content:
                return f"Error: The specified text to replace was not found in '{file_path}'. Please check the exact text including whitespace and indentation."
            
            # Count occurrences to warn about multiple matches
            occurrence_count = original_content.count(old_string)
            if occurrence_count > 1:
                return f"Error: Found {occurrence_count} occurrences of the text to replace in '{file_path}'. Please provide more specific context to ensure unique replacement."
            
            # Create backup before modification
            backup_path = validated_path.with_suffix(validated_path.suffix + '.backup')
            shutil.copy2(validated_path, backup_path)
            
            try:
                # Perform the replacement
                new_content = original_content.replace(old_string, new_string)
                
                # Write the modified content
                with open(validated_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                # Calculate changes
                old_lines = len(old_string.split('\n'))
                new_lines = len(new_string.split('\n'))
                
                return f"Successfully replaced content in '{validated_path.name}'. Changed {old_lines} lines to {new_lines} lines. Backup created at '{backup_path.name}'."
                
            except Exception as write_error:
                # Restore from backup if write failed
                shutil.copy2(backup_path, validated_path)
                backup_path.unlink()  # Remove backup since we restored
                raise write_error
            
        except Exception as e:
            return self._handle_file_error("replace content in", file_path, e)
    
    def get_tools_schema(self) -> List[Dict]:
        """Return the secure tools schema for OpenRouter"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Read the contents of a file, optionally specifying line ranges. Use this to understand file structure before making changes.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {
                                "type": "string",
                                "description": "Path to the file to read (must be within workspace)"
                            },
                            "start_line": {
                                "type": "integer",
                                "description": "Starting line number (1-based, optional)"
                            },
                            "end_line": {
                                "type": "integer", 
                                "description": "Ending line number (1-based, optional)"
                            }
                        },
                        "required": ["file_path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_file",
                    "description": "Create a new file with specified content. Fails if file already exists to prevent accidental overwrites.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {
                                "type": "string",
                                "description": "Path to the new file to create"
                            },
                            "content": {
                                "type": "string",
                                "description": "Content to write to the new file"
                            }
                        },
                        "required": ["file_path", "content"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "replace_content",
                    "description": "Surgically replace specific content in a file. Provide the exact text to replace (including indentation/whitespace) and the new text. This is safer than rewriting entire files.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {
                                "type": "string",
                                "description": "Path to the file to edit"
                            },
                            "old_string": {
                                "type": "string",
                                "description": "Exact string to find and replace (must match exactly including whitespace)"
                            },
                            "new_string": {
                                "type": "string",
                                "description": "String to replace the old string with"
                            }
                        },
                        "required": ["file_path", "old_string", "new_string"]
                    }
                }
            }
        ]
    
    def execute_tool(self, tool_name: str, arguments: Dict) -> str:
        """Execute a tool based on its name and arguments"""
        tool_mapping = {
            "read_file": self.read_file_tool,
            "create_file": self.create_file_tool,
            "replace_content": self.replace_content_tool
        }
        
        if tool_name in tool_mapping:
            return tool_mapping[tool_name](**arguments)
        else:
            return f"SecurityError: Unknown tool '{tool_name}'. Available tools: {list(tool_mapping.keys())}"
    
    def chat(self, user_message: str, max_iterations: int = 10) -> str:
        """Main chat function with tool calling support"""
        # Add system message if this is the first message
        if not self.conversation_history:
            self.conversation_history.append({
                "role": "system",
                "content": f"""You are a secure file editing assistant with access to a limited, safe set of file operations. Your workspace is restricted to: {self.workspace_root}

IMPORTANT SECURITY GUIDELINES:
1. You can only access files within the designated workspace
2. Always read files first to understand their structure before making changes
3. Use replace_content for surgical edits - it's safer than rewriting entire files
4. The replace_content tool requires EXACT string matching including whitespace and indentation
5. When fixing indentation, include surrounding lines for context to ensure unique matches
6. Create backups automatically - they're created for you during replace operations

AVAILABLE TOOLS:
- read_file: Read file contents (with optional line ranges)
- create_file: Create new files (fails if file exists to prevent overwrites)
- replace_content: Surgically replace specific text (the safe way to edit)

WORKFLOW FOR EDITS:
1. Read the file to understand current content
2. Identify the exact text block to change (including surrounding context)
3. Use replace_content with the exact old text and desired new text
4. Verify the change was successful

Always be precise with whitespace and indentation when using replace_content."""
            })
        
        # Add user message to conversation
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        iteration_count = 0
        
        while iteration_count < max_iterations:
            iteration_count += 1
            
            try:
                # Make API call
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.conversation_history,
                    tools=self.get_tools_schema(),
                    extra_headers={
                        "HTTP-Referer": "https://github.com/secure-openrouter-agent",
                        "X-Title": "Secure File Editing Agent"
                    }
                )
                
                assistant_message = response.choices[0].message
                
                # Add assistant message to conversation
                self.conversation_history.append({
                    "role": "assistant",
                    "content": assistant_message.content,
                    "tool_calls": assistant_message.tool_calls
                })
                
                # Check if there are tool calls
                if assistant_message.tool_calls:
                    # Execute each tool call
                    for tool_call in assistant_message.tool_calls:
                        tool_name = tool_call.function.name
                        tool_args = json.loads(tool_call.function.arguments)
                        
                        print(f"🔧 Executing secure tool: {tool_name}")
                        print(f"   Arguments: {tool_args}")
                        
                        # Execute the tool
                        tool_result = self.execute_tool(tool_name, tool_args)
                        
                        print(f"   Result: {tool_result[:100]}{'...' if len(tool_result) > 100 else ''}")
                        
                        # Add tool result to conversation
                        self.conversation_history.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": tool_name,
                            "content": tool_result
                        })
                else:
                    # No more tool calls, return the response
                    return assistant_message.content
                    
            except Exception as e:
                return f"Error in chat iteration {iteration_count}: {str(e)}"
        
        return f"Maximum iterations ({max_iterations}) reached"

def main():
    """Main function to test the secure agent"""
    # Get API key from environment
    api_key = os.getenv("open_key")
    if not api_key:
        print("Error: open_key not found in environment variables")
        return
    
    # Initialize secure agent
    workspace = os.getcwd()  # Current directory as workspace
    agent = SecureFileEditingAgent(api_key, workspace)
    
    print("🔒 Secure OpenRouter File Editing Agent initialized!")
    print(f"📁 Workspace: {workspace}")
    print("\nAvailable secure commands:")
    print("- Read files within workspace")
    print("- Create new files (prevents overwrites)")
    print("- Surgically replace specific content (with automatic backups)")
    print("\nSecurity features:")
    print("- Path traversal protection")
    print("- Workspace restriction")
    print("- Automatic backups")
    print("- Structured error handling")
    print("\nType 'quit' to exit\n")
    
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ['quit', 'exit']:
            break
        
        if user_input:
            response = agent.chat(user_input)
            print(f"🤖 Agent: {response}\n")

if __name__ == "__main__":
    main()