# Scrapbox CLI

This CLI allows you to controle Scrapbox directly from your terminal.

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

