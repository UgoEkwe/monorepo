"""
Environment validation utilities for backend workspace
Validates required environment variables and feature flags
"""

import os
import sys
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

@dataclass
class ValidationResult:
    """Result of environment validation"""
    valid: bool
    errors: List[str]
    warnings: List[str]
    config: Dict[str, any]

class EnvironmentValidator:
    """Validates environment configuration for backend workspace"""
    
    def __init__(self):
        self.required_vars = []
        self.optional_vars = {}
        self.feature_flags = {}
    
    def validate(self) -> ValidationResult:
        """Validate all environment variables and feature flags"""
        errors = []
        warnings = []
        config = {}
        
        # Check database configuration
        database_url = os.getenv("DATABASE_URL")
        enable_database = os.getenv("ENABLE_DATABASE", "true").lower() != "false"
        
        if enable_database and not database_url:
            errors.append("DATABASE_URL is required when ENABLE_DATABASE is true")
        elif not enable_database:
            warnings.append("Database features disabled (ENABLE_DATABASE=false)")
        
        config["database"] = {
            "enabled": enable_database,
            "url_configured": bool(database_url)
        }
        
        # Check Prisma configuration
        enable_prisma = os.getenv("ENABLE_PRISMA", "true").lower() != "false"
        if enable_prisma and not database_url:
            warnings.append("ENABLE_PRISMA is true but DATABASE_URL is not configured")
        
        config["prisma"] = {
            "enabled": enable_prisma and bool(database_url)
        }
        
        # Check AI service configuration
        enable_ai = os.getenv("ENABLE_AI", "true").lower() != "false"
        openai_key = os.getenv("OPENAI_API_KEY")
        
        if enable_ai and not openai_key:
            warnings.append("AI features enabled but OPENAI_API_KEY not configured")
        
        config["ai"] = {
            "enabled": enable_ai,
            "openai_configured": bool(openai_key)
        }
        
        # Check Modal configuration
        enable_modal = os.getenv("ENABLE_MODAL", "false").lower() == "true"
        modal_token = os.getenv("MODAL_TOKEN_ID")
        
        if enable_modal and not modal_token:
            warnings.append("Modal deployment enabled but MODAL_TOKEN_ID not configured")
        
        config["modal"] = {
            "enabled": enable_modal,
            "token_configured": bool(modal_token)
        }
        
        # Check authentication configuration
        jwt_secret = os.getenv("JWT_SECRET_KEY")
        if not jwt_secret:
            if os.getenv("NODE_ENV") == "production":
                errors.append("JWT_SECRET_KEY is required in production")
            else:
                warnings.append("JWT_SECRET_KEY not configured - using development default")
        
        config["auth"] = {
            "jwt_configured": bool(jwt_secret)
        }
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            config=config
        )
    
    def validate_and_exit_on_error(self) -> Dict[str, any]:
        """Validate environment and exit if critical errors found"""
        result = self.validate()
        
        if result.warnings:
            print("Environment Warnings:")
            for warning in result.warnings:
                print(f"  ⚠️  {warning}")
            print()
        
        if result.errors:
            print("Environment Errors:")
            for error in result.errors:
                print(f"  ❌ {error}")
            print("\nPlease fix the above errors before starting the server.")
            sys.exit(1)
        
        print("Environment validation passed ✅")
        return result.config

# Global validator instance
validator = EnvironmentValidator()