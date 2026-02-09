"""
Secure template storage: encrypted identity vectors only. No raw images.
GDPR-style; zero-trust; blockchain-ready (template hash for verification).
"""
from .template_store import TemplateStore, enroll_palm_template, verify_palm_template

__all__ = ["TemplateStore", "enroll_palm_template", "verify_palm_template"]
