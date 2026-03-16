import pytest
from app.crud import crud_user, crud_config
from app.schemas.user import UserCreate
from app.models.user import UserRole
from app.schemas.config import DestinoCreate
import string
import random

def random_string(length=10):
    return ''.join(random.choice(string.ascii_lowercase) for _ in range(length))

def test_create_user_and_check_hash(db):
    email = f"{random_string()}@test.com"
    user_in = UserCreate(email=email, password="strongpassword", nombre="Test User", rol=UserRole.VENDEDOR)
    user = crud_user.create_user(db, user=user_in)
    
    assert user.email == email
    assert user.id is not None
    assert user.password_hash is not None
    assert user.password_hash != "strongpassword"

def test_get_user(db):
    email = f"{random_string()}@test.com"
    user_in = UserCreate(email=email, password="password", nombre="Test User", rol=UserRole.ADMIN)
    user = crud_user.create_user(db, user=user_in)
    
    fetched_user = crud_user.get_user_by_email(db, email=email)
    assert fetched_user.id == user.id
    assert fetched_user.email == email

def test_crud_base_destinos(db):
    # Testing the generic CRUD base using Destino
    nombre_destino = f"Destino_{random_string(5)}"
    
    obj_in = DestinoCreate(nombre=nombre_destino)
    from app.models.config import Destino
    destino = crud_config.crud_destino.create(db, model=Destino, obj_in=obj_in)
    
    assert destino.id is not None
    assert destino.nombre == nombre_destino
    
    # Read
    fetched = crud_config.crud_destino.get(db, model=Destino, id=destino.id)
    assert fetched.nombre == nombre_destino
    
    # Remove
    deleted = crud_config.crud_destino.remove(db, model=Destino, id=destino.id)
    assert deleted.id == destino.id
    assert crud_config.crud_destino.get(db, model=Destino, id=destino.id) is None
