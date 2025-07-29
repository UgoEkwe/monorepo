"""
Secrets Management Utility for Backend
Handles automatic credential fetching and validation with workspace resilience
"""
import os
from typing import Dict, Optional, Any, List
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class SecretsManager:
    """Manages environment secrets and configuration with workspace resilience"""
    
    def __init__(self):
        self.required_secrets = [
            'DATABASE_URL',
            'SUPABASE_URL', 
            'SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'OPENROUTER_API_KEY'
        ]
        
        self.optional_secrets = [
            'SUPABASE_JWT_SECRET',
            'STRIPE_SECRET_KEY',
            'STRIPE_PUBLISHABLE_KEY',
            'STRIPE_WEBHOOK_SECRET',
            'MODAL_TOKEN_ID',
            'MODAL_TOKEN_SECRET',
            'NODE_ENV',
            'API_PORT',
            'DEBUG'
        ]
        
        # Workspace configuration for modular setup
        self.workspace_configs = {
            'web': {
                'required': ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
                'optional': ['NEXTAUTH_URL', 'NEXTAUTH_SECRET']
            },
            'mobile': {
                'required': ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
                'optional': []
            },
            'payments': {
                'required': ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
                'optional': ['STRIPE_WEBHOOK_SECRET']
            },
            'ai': {
                'required': ['OPENROUTER_API_KEY'],
                'optional': ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY']
            }
        }
    
    def check_workspace_availability(self) -> Dict[str, bool]:
        """Check which workspaces are available and properly configured"""
        workspace_status = {}
        workspaces_dir = Path(__file__).parent.parent.parent / 'workspaces'
        
        for workspace_name in self.workspace_configs.keys():
            workspace_path = workspaces_dir / workspace_name
            if workspace_path.exists():
                workspace_status[workspace_name] = True
            else:
                workspace_status[workspace_name] = False
                logger.info(f"Workspace {workspace_name} not found - will use fallback configurations")
        
        return workspace_status
    
    def validate_workspace_secrets(self, workspace_name: str) -> Dict[str, Any]:
        """Validate secrets for a specific workspace"""
        if workspace_name not in self.workspace_configs:
            return {'valid': True, 'missing_secrets': [], 'present_secrets': []}
        
        config = self.workspace_configs[workspace_name]
        validation_result = {
            'valid': True,
            'missing_secrets': [],
            'present_secrets': []
        }
        
        # Check required secrets for this workspace
        for secret in config['required']:
            if os.getenv(secret):
                validation_result['present_secrets'].append(secret)
            else:
                validation_result['missing_secrets'].append(secret)
                validation_result['valid'] = False
        
        return validation_result
    
    def validate_secrets(self) -> Dict[str, Any]:
        """Validate that all required secrets are present with workspace awareness"""
        validation_result = {
            'valid': True,
            'missing_secrets': [],
            'present_secrets': [],
            'development_mode': os.getenv('NODE_ENV') == 'development',
            'workspace_status': self.check_workspace_availability()
        }
        
        # Check core required secrets
        for secret in self.required_secrets:
            if os.getenv(secret):
                validation_result['present_secrets'].append(secret)
            else:
                validation_result['missing_secrets'].append(secret)
                validation_result['valid'] = False
        
        # Check optional secrets
        for secret in self.optional_secrets:
            if os.getenv(secret):
                validation_result['present_secrets'].append(secret)
        
        # Check workspace-specific secrets
        for workspace_name in self.workspace_configs.keys():
            if validation_result['workspace_status'].get(workspace_name, False):
                workspace_validation = self.validate_workspace_secrets(workspace_name)
                if not workspace_validation['valid']:
                    validation_result['valid'] = False
                    validation_result['missing_secrets'].extend(workspace_validation['missing_secrets'])
        
        return validation_result
    
    def get_supabase_config(self) -> Dict[str, Optional[str]]:
        """Get Supabase configuration with fallbacks"""
        return {
            'url': os.getenv('SUPABASE_URL'),
            'anon_key': os.getenv('SUPABASE_ANON_KEY'),
            'service_role_key': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
            'jwt_secret': os.getenv('SUPABASE_JWT_SECRET'),
        }
    
    def get_database_config(self) -> Dict[str, Optional[str]]:
        """Get database configuration"""
        return {
            'url': os.getenv('DATABASE_URL'),
        }
    
    def get_ai_config(self) -> Dict[str, Optional[str]]:
        """Get AI configuration"""
        return {
            'openrouter_api_key': os.getenv('OPENROUTER_API_KEY'),
            'openrouter_model': os.getenv('OPENROUTER_MODEL', 'anthropic/claude-3-haiku'),
            'openai_api_key': os.getenv('OPENAI_API_KEY'),
            'anthropic_api_key': os.getenv('ANTHROPIC_API_KEY'),
        }
    
    def get_payment_config(self) -> Dict[str, Optional[str]]:
        """Get payment configuration"""
        return {
            'stripe_secret_key': os.getenv('STRIPE_SECRET_KEY'),
            'stripe_publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY'),
            'stripe_webhook_secret': os.getenv('STRIPE_WEBHOOK_SECRET'),
        }
    
    def get_deployment_config(self) -> Dict[str, Optional[str]]:
        """Get deployment configuration"""
        return {
            'modal_token_id': os.getenv('MODAL_TOKEN_ID'),
            'modal_token_secret': os.getenv('MODAL_TOKEN_SECRET'),
            'node_env': os.getenv('NODE_ENV', 'development'),
            'api_port': os.getenv('API_PORT', '8000'),
            'debug': os.getenv('DEBUG', 'false').lower() == 'true',
        }
    
    def get_workspace_configs(self) -> Dict[str, Dict[str, Any]]:
        """Get workspace-specific configurations"""
        return {
            'web': {
                'supabase_url': os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
                'supabase_anon_key': os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
                'nextauth_url': os.getenv('NEXTAUTH_URL'),
                'nextauth_secret': os.getenv('NEXTAUTH_SECRET'),
            },
            'mobile': {
                'supabase_url': os.getenv('EXPO_PUBLIC_SUPABASE_URL'),
                'supabase_anon_key': os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
            },
            'payments': {
                'stripe_secret_key': os.getenv('STRIPE_SECRET_KEY'),
                'stripe_publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY'),
                'stripe_webhook_secret': os.getenv('STRIPE_WEBHOOK_SECRET'),
            }
        }
    
    def get_all_config(self) -> Dict[str, Any]:
        """Get all configuration grouped by category"""
        return {
            'supabase': self.get_supabase_config(),
            'database': self.get_database_config(),
            'ai': self.get_ai_config(),
            'payment': self.get_payment_config(),
            'deployment': self.get_deployment_config(),
            'workspaces': self.get_workspace_configs(),
        }
    
    def setup_development_fallbacks(self) -> None:
        """Set up development mode fallbacks with workspace awareness"""
        if os.getenv('NODE_ENV') == 'development':
            logger.info("Development mode: Setting up fallback configurations")
            
            # Set default values for development
            if not os.getenv('DATABASE_URL'):
                os.environ['DATABASE_URL'] = 'postgresql://username:password@localhost:5432/modular_ai_scaffold'
            
            if not os.getenv('SUPABASE_URL'):
                os.environ['SUPABASE_URL'] = 'https://your-project.supabase.co'
            
            if not os.getenv('SUPABASE_ANON_KEY'):
                os.environ['SUPABASE_ANON_KEY'] = 'your-supabase-anon-key'
            
            # Web workspace fallbacks
            if not os.getenv('NEXT_PUBLIC_SUPABASE_URL'):
                os.environ['NEXT_PUBLIC_SUPABASE_URL'] = 'https://your-project.supabase.co'
            
            if not os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'):
                os.environ['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'your-supabase-anon-key'
            
            # Mobile workspace fallbacks
            if not os.getenv('EXPO_PUBLIC_SUPABASE_URL'):
                os.environ['EXPO_PUBLIC_SUPABASE_URL'] = 'https://your-project.supabase.co'
            
            if not os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY'):
                os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY'] = 'your-supabase-anon-key'
            
            # Payments workspace fallbacks
            if not os.getenv('STRIPE_SECRET_KEY'):
                os.environ['STRIPE_SECRET_KEY'] = 'sk_test_your-stripe-secret-key'
            
            if not os.getenv('STRIPE_PUBLISHABLE_KEY'):
                os.environ['STRIPE_PUBLISHABLE_KEY'] = 'pk_test_your-stripe-publishable-key'
    
    def validate_and_setup(self) -> bool:
        """Validate secrets and setup fallbacks if needed with instant authentication"""
        self.setup_development_fallbacks()
        validation = self.validate_secrets()
        
        if not validation['valid']:
            logger.warning(f"Missing required secrets: {validation['missing_secrets']}")
            if validation['development_mode']:
                logger.info("Development mode: Continuing with mock data where available")
                return True
            else:
                logger.error("Production mode: Missing required secrets")
                return False
        
        logger.info("All secrets validated successfully - authentication ready")
        return True

# Global instance
secrets_manager = SecretsManager()

def get_secrets_manager() -> SecretsManager:
    """Get the global secrets manager instance"""
    return secrets_manager
