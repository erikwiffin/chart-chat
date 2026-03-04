from dotenv import load_dotenv

load_dotenv()  # Must precede app imports

from app.api.commands import cli

if __name__ == "__main__":
    cli()
