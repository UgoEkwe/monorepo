#!/usr/bin/env python3
"""
Hybrid dependency installer for Python/JS backend workspace
Validates environment and installs only required dependencies
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_env_var(name: str, required: bool = False) -> str:
    """Check if environment variable exists and return its value"""
    value = os.getenv(name)
    if required and not value:
        print(f"ERROR: Required environment variable {name} is not set")
        sys.exit(1)
    return value or ""

def validate_environment():
    """Validate required environment variables"""
    print("Validating environment...")
    
    # Check database configuration
    database_url = check_env_var("DATABASE_URL")
    if not database_url:
        print("WARNING: DATABASE_URL not set - database features will be disabled")
    
    # Check if Prisma should be enabled
    enable_prisma = check_env_var("ENABLE_PRISMA", False) != "false"
    if enable_prisma and not database_url:
        print("WARNING: ENABLE_PRISMA is true but DATABASE_URL is not set")
    
    return {
        "database_url": database_url,
        "enable_prisma": enable_prisma,
        "enable_ai": check_env_var("ENABLE_AI", False) != "false",
        "enable_modal": check_env_var("ENABLE_MODAL", False) != "false"
    }

def install_python_deps(config: dict):
    """Install Python dependencies based on configuration"""
    print("Installing Python dependencies...")
    
    # Base requirements
    base_requirements = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0", 
        "pydantic==2.5.0",
        "pydantic-settings==2.1.0",
        "python-multipart==0.0.6",
        "python-dotenv==1.0.0",
        "httpx==0.25.2"
    ]
    
    # Conditional requirements
    conditional_requirements = []
    
    if config["enable_prisma"]:
        conditional_requirements.append("prisma==0.11.0")
    
    if config["enable_modal"]:
        conditional_requirements.append("modal==0.57.0")
    
    # Auth requirements (usually needed)
    if config.get("enable_auth", True):
        conditional_requirements.extend([
            "python-jose[cryptography]==3.3.0",
            "passlib[bcrypt]==1.7.4"
        ])
    
    all_requirements = base_requirements + conditional_requirements
    
    # Install requirements
    for req in all_requirements:
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", req], check=True)
            print(f"✓ Installed {req}")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {req}: {e}")
            if req in base_requirements:
                sys.exit(1)  # Fail on base requirements
            else:
                print(f"  Continuing without {req} (optional dependency)")

def install_js_deps(config: dict):
    """Install JavaScript dependencies for Prisma and other JS tools"""
    package_json_path = Path("package.json")
    
    if not package_json_path.exists():
        print("No package.json found, skipping JS dependencies")
        return
    
    print("Installing JavaScript dependencies...")
    
    try:
        # Install JS dependencies
        subprocess.run(["npm", "install"], check=True)
        print("✓ Installed JavaScript dependencies")
        
        # Generate Prisma client if enabled
        if config["enable_prisma"] and config["database_url"]:
            try:
                subprocess.run(["npx", "prisma", "generate"], check=True)
                print("✓ Generated Prisma client")
            except subprocess.CalledProcessError as e:
                print(f"✗ Failed to generate Prisma client: {e}")
                print("  Database features may not work properly")
        
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install JavaScript dependencies: {e}")
        print("  Some features may not work properly")

def main():
    """Main installation process"""
    print("=== Backend Dependency Installation ===")
    
    # Validate environment
    config = validate_environment()
    
    # Install dependencies
    install_python_deps(config)
    install_js_deps(config)
    
    print("\n=== Installation Summary ===")
    print(f"Database: {'✓' if config['database_url'] else '✗'}")
    print(f"Prisma: {'✓' if config['enable_prisma'] else '✗'}")
    print(f"AI Features: {'✓' if config['enable_ai'] else '✗'}")
    print(f"Modal: {'✓' if config['enable_modal'] else '✗'}")
    print("\nInstallation complete!")

if __name__ == "__main__":
    main()