"""
Storage: encrypted facial templates only. Never store raw images.
"""
from .template_store import TemplateStore, enroll_template, verify_against_templates

__all__ = ["TemplateStore", "enroll_template", "verify_against_templates"]
