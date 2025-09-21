# Architecture Overview

This project follows a Clean Architecture / Hexagonal Architecture pattern. The code is organized into three main layers: Domain, Application, and Infrastructure. This separation of concerns makes the application more modular, testable, and easier to maintain.

The core principle of this architecture is the **Dependency Rule**: source code dependencies can only point inwards. Nothing in an inner layer can know anything at all about something in an outer layer.

## Architecture Diagram

```mermaid
graph TD
    subgraph "User Interface / External"
        direction LR
        CLI[CLI Commands]
    end

    subgraph Infrastructure
        direction LR
        Adapters[Adapters (Scrapbox API, Date Provider)]
    end

    subgraph Application
        direction LR
        UseCases[Use Cases (PostBlog, etc.)]
        Ports[Ports (Interfaces)]
    end

    subgraph Domain
        direction LR
        Models[Domain Models (ScrapboxPage)]
    end

    CLI --> UseCases
    Adapters -- implements --> Ports
    UseCases -- uses --> Ports
    UseCases -- uses --> Models
```

## Layers

### 1. Domain Layer

This is the core of the application. It contains the enterprise-wide business rules and entities. It has no dependencies on any other layer.

-   `src/domain/models`: Contains the domain entities, like `ScrapboxPage`.

### 2. Application Layer

This layer contains the application-specific business rules. It orchestrates the flow of data between the domain and the infrastructure layers. It defines the boundaries (ports) for the outer layers.

-   `src/application/use-cases`: Implements the specific use cases of the application (e.g., `PostDailyBlogUseCase`).
-   `src/application/ports`: Defines the interfaces (ports) that are implemented by the infrastructure layer (e.g., `ScrapboxRepository`, `DateProvider`).

### 3. Infrastructure Layer

This layer is where all the I/O details go. This includes the UI, database access, frameworks, and other external concerns. It implements the ports defined in the application layer to connect the application to the outside world.

-   `src/infrastructure/adapters`: Contains the concrete implementations (adapters) of the ports. For example, `ScrapboxRepositoryImpl` implements the `ScrapboxRepository` interface using an external library.
-   `src/infrastructure/cli`: Contains the entry points for the command-line interface. These files are responsible for parsing command-line arguments and calling the appropriate use cases.
