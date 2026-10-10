const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SYLO - Project Management API",
            version: "1.0.0",
            description: "API documentation for SYLO, a collaborative project management application",
            contact: {
                name: "SYLO Team"
            }
        },

    servers: [
    {
        url: process.env.API_URL || "http://localhost:5000",
        description: process.env.NODE_ENV === "production"
            ? "Production Server"
            : "Development Server"
    }
],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },
            schemas: {
                User: {
                    type: "object",
                    required: ["firstName", "lastName", "username", "email"],
                    properties: {
                        _id: {
                            type: "string"
                        },
                        firstName: {
                            type: "string"
                        },
                        lastName: {
                            type: "string"
                        },
                        username: {
                            type: "string"
                        },
                        email: {
                            type: "string"
                        },
                        isEmailVerified: {
                            type: "boolean"
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time"
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time"
                        }
                    }
                },
                Project: {
                    type: "object",
                    required: ["name", "owner"],
                    properties: {
                        _id: {
                            type: "string"
                        },
                        name: {
                            type: "string"
                        },
                        description: {
                            type: "string"
                        },
                        owner: {
                            type: "string"
                        },
                        collaborators: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },
                        deadline: {
                            type: "string",
                            format: "date-time"
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time"
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time"
                        }
                    }
                },
                Task: {
                    type: "object",
                    required: ["title", "project", "createdBy"],
                    properties: {
                        _id: {
                            type: "string"
                        },
                        title: {
                            type: "string"
                        },
                        description: {
                            type: "string"
                        },
                        project: {
                            type: "string"
                        },
                        assignees: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },
                        status: {
                            type: "string",
                            enum: ["todo", "in-progress", "completed"]
                        },
                        deadline: {
                            type: "string",
                            format: "date-time"
                        },
                        createdBy: {
                            type: "string"
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time"
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time"
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: "Auth",
                description: "Authentication routes"
            },
            {
                name: "Projects",
                description: "Project management routes"
            },
            {
                name: "Tasks",
                description: "Task management routes"
            },
            {
                name: "Users",
                description: "User management routes"
            }
        ]
    },
    apis: ["./routes/*.js"]
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
