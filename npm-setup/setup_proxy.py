import requests

# NPM API credentials
npm_url = "http://nginx-proxy-manager:81/api"
npm_email = "admin@example.com"  # Default admin email
npm_password = "changeme"        # Default admin password
new_email = "admin@gmail.com"  # Replace with your desired email
new_password = "adminbioskop"        # Replace with your desired password

# Proxy host configurations
proxy_hosts = [
    {
        "domain": "lb-cinema.site",
        "forward_host": "movieapp_frontend",
        "forward_port": 80
    },
    {
        "domain": "api.lb-cinema.site",
        "forward_host": "movieapp_backend",
        "forward_port": 3000
    },
    {
        "domain": "wp.lb-cinema.site",
        "forward_host": "movieapp_wordpress",
        "forward_port": 80
    }
]

# Authenticate with NPM API
def authenticate(email, password):
    response = requests.post(f"{npm_url}/tokens", json={
        "identity": email,
        "secret": password
    })
    if response.status_code == 401:
        print("Authentication failed. Please check your credentials.")
        exit(1)
    response.raise_for_status()
    return response.json()["token"]

# Update admin credentials
def update_admin_credentials(token, new_email, new_password):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "email": new_email,
        "password": new_password,
        "password_repeat": new_password
    }
    response = requests.put(f"{npm_url}/users/1", headers=headers, json=data)
    response.raise_for_status()
    print("Admin credentials updated successfully.")

# Add proxy host
def add_proxy_host(token, domain, forward_host, forward_port):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "domain_names": [domain],
        "forward_host": forward_host,
        "forward_port": forward_port,
        "access_list_id": 0,
        "certificate_id": 0,
        "ssl_forced": False,
        "caching_enabled": False,
        "block_exploits": False,
        "advanced_config": "",
        "meta": {"letsencrypt_agree": False, "dns_challenge": False},
        "allow_websocket_upgrade": False,
        "http2_support": False,
        "forward_scheme": "http"
    }
    response = requests.post(f"{npm_url}/proxy-hosts", headers=headers, json=data)
    response.raise_for_status()
    print(f"Proxy host added: {domain}")

# Main script
if __name__ == "__main__":
    # Authenticate with default credentials
    token = authenticate(npm_email, npm_password)

    # Update admin credentials if using default ones
    if npm_email == "admin@example.com" and npm_password == "changeme":
        print("Updating admin credentials...")
        update_admin_credentials(token, new_email, new_password)
        # Re-authenticate with new credentials
        token = authenticate(new_email, new_password)

    # Add proxy hosts
    for host in proxy_hosts:
        add_proxy_host(token, host["domain"], host["forward_host"], host["forward_port"])
