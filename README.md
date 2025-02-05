# Scrapbox CLI

This CLI allows you to controle Scrapbox directly from your terminal.

## Setup and Usage

1. **Clone the Repository**

   ```bash
   git clone https://github.com/katayama8000/scrapbox-cli
   cd scrapbox-write-cli
   ```

2. **Install Dependencies**

   ```bash
   npm i
   ```

3. **Configure Environment**

   - Copy `.env.dist` to `.env` and set your Scrapbox Session ID in `.env`:
     ```bash
     cp .env.dist .env
     ```

4. **Run Commands**
   - For daily updates:
     ```bash
     npm run daily
     ```
   - For weekly updates:
     ```bash
     npm run weekly
     ```

> **Tip**: To automate, set up these commands to run on GitHub Actions.
