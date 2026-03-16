def test_read_main(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "AlexisEVT" in response.json()["message"]

def test_config_endpoints(client):
    # Public GET endpoints
    res = client.get("/api/v1/config/destinos/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_login_unauthorized(client):
    res = client.post("/api/v1/auth/login", data={"username": "falso@xyz.com", "password": "abc"})
    assert res.status_code == 401

# Real authentication testing requires a seeded admin user.
# In a full test suite, we'd seed the DB using the `db` fixture.
