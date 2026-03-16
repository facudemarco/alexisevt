import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

import pytest
from datetime import timedelta
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from jose import jwt

def test_password_hashing():
    password = "supersecretpassword123"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_create_access_token():
    subject = "user123"
    expires_delta = timedelta(minutes=15)
    
    # Generate Token
    token = create_access_token(subject=subject, expires_delta=expires_delta)
    assert isinstance(token, str)
    
    # Decode Token Manually
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    
    assert "exp" in payload
    assert payload["sub"] == subject
