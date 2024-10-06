# Scrapbox CLI

This CLI tool allows you to Scrapbox pages directly from your terminal.

## Usage

1. **Clone the Repository**
    ```bash
    git clone https://github.com/katayama8000/scrapbox-write-cli
    cd scrapbox-write-cli
    ```

2. **Install Dependencies**
    ```bash
    yarn install
    ```

3. **Configure Environment Variables**
    - Copy the `.env.dist` file to create a `.env` file:
      ```bash
      cp .env.dist .env
      ```
    - Get your Session ID from Scrapbox and set it in the `.env` file.

4. **Run the CLI**
    - For daily updates:
      ```bash
      yarn daily
      ```
    - For weekly updates:
      ```bash
      yarn weekly
      ```
    I highly recommend running the CLI on github actions.

