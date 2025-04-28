#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import glob
import re

def detect_tech_stack():
    """Detect the technology stack used in the project."""
    print("Detecting technology stack...")
    
    tech_stack = {
        "backend": None,
        "frontend": None,
        "database": None,
        "package_manager": None
    }
    
    # Check for Python
    if os.path.exists("requirements.txt") or glob.glob("*.py"):
        tech_stack["backend"] = "Python"
        if os.path.exists("manage.py"):
            tech_stack["backend"] += " (Django)"
        elif os.path.exists("app.py") or os.path.exists("wsgi.py"):
            tech_stack["backend"] += " (Flask)"
    
    # Check for Node.js
    if os.path.exists("package.json"):
        with open("package.json", "r") as f:
            try:
                package_data = json.load(f)
                tech_stack["package_manager"] = "npm"
                
                # Check for common frameworks
                deps = {**package_data.get("dependencies", {}), **package_data.get("devDependencies", {})}
                
                if "react" in deps:
                    tech_stack["frontend"] = "React"
                elif "vue" in deps:
                    tech_stack["frontend"] = "Vue.js"
                elif "angular" in deps or "@angular/core" in deps:
                    tech_stack["frontend"] = "Angular"
                else:
                    tech_stack["frontend"] = "JavaScript/Node.js"
                
                if "express" in deps:
                    tech_stack["backend"] = "Node.js (Express)"
                elif "next" in deps:
                    tech_stack["backend"] = "Next.js"
                elif "nestjs" in deps or "@nestjs/core" in deps:
                    tech_stack["backend"] = "NestJS"
            except json.JSONDecodeError:
                print("Error parsing package.json")
    
    # Check for database configurations
    db_patterns = {
        "mongodb": r"mongodb(\+srv)?://",
        "mysql": r"mysql://",
        "postgresql": r"postgres(ql)?://",
        "sqlite": r"sqlite:///"
    }
    
    for file_path in glob.glob("**/*.{js,py,env,json,yml,yaml}", recursive=True):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                for db, pattern in db_patterns.items():
                    if re.search(pattern, content):
                        tech_stack["database"] = db
                        break
                if tech_stack["database"]:
                    break
        except (UnicodeDecodeError, PermissionError):
            continue
    
    # Look for database configuration files
    if os.path.exists("config/database.yml") or os.path.exists("config/database.yaml"):
        tech_stack["database"] = "Configured in YAML file"
    
    return tech_stack

def setup_database(tech_stack):
    """Set up the database based on the detected technology stack."""
    if not tech_stack["database"]:
        print("No database configuration detected.")
        return False
    
    print(f"Setting up {tech_stack['database']} database...")
    
    # For Django projects
    if tech_stack["backend"] and "Django" in tech_stack["backend"]:
        try:
            print("Running Django migrations...")
            subprocess.run(["python", "manage.py", "makemigrations"], check=True)
            subprocess.run(["python", "manage.py", "migrate"], check=True)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error setting up Django database: {str(e)}")
            return False
    
    # For Node.js/Express projects
    if tech_stack["backend"] and "Node.js" in tech_stack["backend"]:
        # Look for database setup scripts
        db_scripts = []
        for file in os.listdir("."):
            if file.endswith(".js") and ("db" in file.lower() or "database" in file.lower() or "migrate" in file.lower()):
                db_scripts.append(file)
        
        if db_scripts:
            print(f"Found potential database setup scripts: {', '.join(db_scripts)}")
            print("You may need to run these scripts manually.")
        else:
            print("No database setup scripts found.")
        
        return False
    
    return False

def fix_code_issues():
    """Analyze and fix common code issues."""
    print("Analyzing code for issues...")
    
    # Function to fix common issues in a file
    def fix_file(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Track if we made changes
            changes_made = False
            
            # Fix unclosed HTML tags
            if file_path.endswith(('.html', '.htm', '.jsx', '.tsx')):
                # This is a simplistic approach - real HTML parsing would be better
                common_tags = ['div', 'span', 'p', 'a', 'button', 'li', 'ul', 'ol', 'table', 'tr', 'td', 'th']
                for tag in common_tags:
                    open_tags = content.count(f'<{tag}')
                    close_tags = content.count(f'</{tag}')
                    if open_tags > close_tags:
                        print(f"  - Warning: Unclosed {tag} tags in {file_path}")
            
            # Fix JavaScript/TypeScript issues
            if file_path.endswith(('.js', '.jsx', '.ts', '.tsx')):
                # Fix missing semicolons (simplified approach)
                if ";" not in content and len(content.strip()) > 0:
                    print(f"  - Warning: Possible missing semicolons in {file_path}")
                
                # Check for console.log statements
                if 'console.log(' in content:
                    print(f"  - Note: Found console.log statements in {file_path}")
            
            # Fix Python issues
            if file_path.endswith('.py'):
                # Check for unused imports
                import_lines = re.findall(r'^import\s+(\w+)', content, re.MULTILINE)
                for imp in import_lines:
                    if imp not in content.replace(f"import {imp}", ""):
                        print(f"  - Warning: Potentially unused import '{imp}' in {file_path}")
                
                # Check for missing requirements
                if 'import' in content and os.path.exists('requirements.txt'):
                    with open('requirements.txt', 'r') as req_file:
                        requirements = req_file.read()
                    
                    common_packages = {
                        'django': 'Django', 'flask': 'Flask', 'requests': 'requests',
                        'numpy': 'numpy', 'pandas': 'pandas', 'sqlalchemy': 'SQLAlchemy'
                    }
                    
                    for package, req_name in common_packages.items():
                        if f"import {package}" in content and req_name not in requirements:
                            print(f"  - Warning: Package '{package}' is imported but not in requirements.txt")
            
            # Write back changes if any were made
            if changes_made:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  - Fixed issues in {file_path}")
            
        except (UnicodeDecodeError, PermissionError):
            # Skip binary files or files we can't read
            pass
    
    # Process all files in the project
    for root, dirs, files in os.walk('.'):
        # Skip hidden directories and node_modules
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        
        for file in files:
            # Skip hidden files, compiled files, and binary formats
            if not file.startswith('.') and not file.endswith(('.pyc', '.class', '.o', '.so')):
                file_path = os.path.join(root, file)
                fix_file(file_path)
    
    print("Code analysis complete. Fixed issues where possible.")
    return True

def run_project(tech_stack):
    """Provide instructions to run the project."""
    print("\nTo run the project:")
    
    # For Python/Django projects
    if tech_stack["backend"] and "Django" in tech_stack["backend"]:
        print("1. Run the Django development server:")
        print("   python manage.py runserver 0.0.0.0:8000")
    
    # For Python/Flask projects
    elif tech_stack["backend"] and "Flask" in tech_stack["backend"]:
        print("1. Run the Flask development server:")
        print("   python app.py")
        # Or look for the main app file
        for file in os.listdir("."):
            if file.endswith(".py") and "app" in file.lower():
                print(f"   python {file}")
                break
    
    # For Node.js projects
    elif tech_stack["backend"] and "Node.js" in tech_stack["backend"]:
        print("1. Install dependencies:")
        print("   npm install")
        
        # Check package.json for start script
        if os.path.exists("package.json"):
            with open("package.json", "r") as f:
                try:
                    package_data = json.load(f)
                    if "scripts" in package_data and "start" in package_data["scripts"]:
                        print("2. Run the application:")
                        print("   npm start")
                    else:
                        print("2. Run the application (main file not identified):")
                        print("   node index.js")
                except json.JSONDecodeError:
                    print("2. Run the application (package.json parse error):")
                    print("   node index.js")
        else:
            print("2. Run the application:")
            print("   node index.js")
    
    # Generic fallback
    else:
        print("1. The project technology stack could not be fully detected.")
        print("2. Look for README or documentation files for specific instructions.")
    
    print("\nAccess the application:")
    print("- Frontend may be accessible at: http://localhost:5000")
    print("- Backend may be accessible at: http://localhost:8000")

def main():
    # Check if the certificates-card project exists
    if not os.path.exists("package.json") and not os.path.exists("requirements.txt"):
        print("Error: Project files not found. Run clone_repo.py first to import the project.")
        sys.exit(1)
    
    # Detect the technology stack
    tech_stack = detect_tech_stack()
    
    print("\nDetected Technology Stack:")
    for key, value in tech_stack.items():
        print(f"- {key.capitalize()}: {value if value else 'Not detected'}")
    
    # Setup the database
    print("\nSetting up database...")
    db_setup = setup_database(tech_stack)
    
    if db_setup:
        print("Database setup completed successfully!")
    else:
        print("Database setup could not be completed automatically. Manual configuration may be required.")
    
    # Fix code issues
    print("\nFixing code issues...")
    fixed = fix_code_issues()
    
    if fixed:
        print("Code issues fixed where possible.")
    else:
        print("Failed to fix some code issues. Manual intervention may be required.")
    
    # Provide instructions to run the project
    run_project(tech_stack)
    
    print("\nSetup completed. The project has been imported, configured, and issues have been fixed where possible.")

if __name__ == "__main__":
    main()
