#!/usr/bin/env python3
import os
import subprocess
import sys

def search_github_repo(repo_name):
    """Search for a GitHub repository and return the best match URL."""
    print(f"Searching for GitHub repository: {repo_name}")
    
    try:
        # Use GitHub API to search for repositories
        import requests
        search_url = f"https://api.github.com/search/repositories?q={repo_name}"
        response = requests.get(search_url)
        
        if response.status_code != 200:
            print(f"Error searching GitHub: {response.status_code}")
            print(response.text)
            return None
        
        data = response.json()
        
        if data.get('total_count', 0) == 0:
            print(f"No repositories found matching '{repo_name}'")
            return None
        
        # Get the first (best match) repository
        repo = data['items'][0]
        repo_url = repo['html_url']
        print(f"Found repository: {repo_url}")
        
        return repo_url
    
    except Exception as e:
        print(f"Error while searching for repository: {str(e)}")
        return None

def clone_repository(repo_url, target_dir='.'):
    """Clone the repository to the target directory."""
    try:
        print(f"Cloning repository from {repo_url} to {target_dir}")
        subprocess.run(['git', 'clone', repo_url, target_dir], check=True)
        print("Repository cloned successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error cloning repository: {str(e)}")
        return False
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return False

def main():
    # Use the exact GitHub URL
    repo_url = "https://github.com/mahm1oud/certificates-card.git"
    print(f"Using provided GitHub repository: {repo_url}")
    
    # Clone the repository
    # Create a temporary directory for cloning
    import tempfile
    temp_dir = tempfile.mkdtemp()
    print(f"Using temporary directory: {temp_dir}")
    
    success = clone_repository(repo_url, temp_dir)
    
    if not success:
        print("Failed to clone the repository.")
        sys.exit(1)
        
    # Copy files from temp directory to current directory
    import shutil
    for item in os.listdir(temp_dir):
        src = os.path.join(temp_dir, item)
        dst = os.path.join('.', item)
        if os.path.isdir(src):
            if not os.path.exists(dst):
                shutil.copytree(src, dst)
            else:
                print(f"Directory already exists: {dst}")
        else:
            shutil.copy2(src, dst)
    
    print(f"Files copied from {temp_dir} to current directory")
    
    print("\nNext steps:")
    print("1. Run 'python setup_project.py' to configure the database and fix issues")
    print("2. Follow the instructions provided by the setup script")

if __name__ == "__main__":
    main()
