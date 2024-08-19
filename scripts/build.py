import os
import subprocess
import shutil
import sys

# Calculate project root based on the script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, os.pardir))

# Define paths relative to the project root
frontend_dir = os.path.join(project_root, "web_client")
build_dir = os.path.join(frontend_dir, "dist")
static_dir = os.path.join(project_root, "web_client_dist")


def check_node_version():
    try:
        # Check Node.js version
        result = subprocess.run(
            ["node", "--version"], capture_output=True, text=True, check=True
        )
        node_version = result.stdout.strip()
        major_version = int(node_version.lstrip("v").split(".")[0])

        if major_version < 20:
            print(
                f"Error: Node.js version {node_version} is installed. Please upgrade to Node.js 20 or above."
            )
            sys.exit(1)
        else:
            print(f"Node.js version {node_version} is sufficient.")

    except FileNotFoundError:
        print("Error: Node.js is not installed. Please install Node.js 20 or above.")
        sys.exit(1)


def check_pnpm():
    try:
        # Check if pnpm is available
        subprocess.run(
            ["pnpm", "--version"], capture_output=True, text=True, check=True
        )
        print("pnpm is available.")
    except FileNotFoundError:
        print(
            "Error: pnpm is not available. Please ensure that Node.js 20 or above is installed and pnpm is available in the PATH."
        )
        sys.exit(1)


def build_frontend():
    # Change to the frontend directory and run the build command
    os.chdir(frontend_dir)
    subprocess.run("pnpm build", shell=True, check=True)


def move_build():
    # Move the build output to the static directory
    if os.path.exists(static_dir):
        shutil.rmtree(static_dir)
    shutil.move(build_dir, static_dir)


if __name__ == "__main__":
    check_node_version()
    check_pnpm()
    build_frontend()
    move_build()
    print(f"Build completed and moved to {static_dir}")
