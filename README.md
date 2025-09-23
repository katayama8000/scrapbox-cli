# Scrapbox CLI

This CLI allows you to control Scrapbox directly from your terminal.

## Setup and Usage

1. **Clone the Repository**

   ```bash
   git clone https://github.com/katayama8000/scrapbox-cli
   cd scrapbox-cli
   ```

2. **Install Dependencies**

   ```bash
   yarn install
   ```

3. **Configure Environment**
   - Copy `.env.dist` to `.env` and set your Scrapbox Session ID in `.env`:
     ```bash
     cp .env.dist .env
     ```

4. **Run Commands**
   - For daily updates:
     ```bash
     yarn daily
     ```
   - For weekly updates:
     ```bash
     yarn weekly
     ```

5. **Run on GitHub Actions**
   - set secrets in your repository settings:
     - `SCRAPBOX_SID`
     - `DISCORD_WEBHOOK`
     - `BACKLOG_API_KEY`
   - Enable GitHub Actions in your repository.

## Architecture

This project's design is a hybrid of **Clean Architecture** and **Hexagonal Architecture** (Ports and Adapters).

- It uses the layered structure of Clean Architecture (`domain`, `application`, `infrastructure`) to separate concerns.
- It implements the "Ports and Adapters" pattern from Hexagonal Architecture, using interfaces (`ports`) to decouple the application core from external tools like APIs.

The key principle is the **Dependency Rule**: dependencies only flow inwards, from `infrastructure` to `application` to `domain`. This makes the core business logic independent of external details, improving testability and maintainability.

For a more detailed breakdown and diagrams, see [ARCHITECTURE.md](ARCHITECTURE.md).
