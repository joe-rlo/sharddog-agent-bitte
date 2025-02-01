import { NextResponse } from "next/server";


const key = JSON.parse(process.env.BITTE_KEY || "{}");
const config = JSON.parse(process.env.BITTE_CONFIG || "{}");

if (!key?.accountId) {
    console.error("no account");
}

export async function GET() {
    const pluginData = {
        openapi: "3.0.0",
        info: {
            title: "ShardDog Treat Maker (testnet)",
            description: "API for managing ShardDog treats - create channels and mint treats (testnet)",
            version: "1.0.0",
        },
        servers: [
            {
                url:"https://sharddog-agent-bitte.vercel.app",
            },
        ],
        "x-mb": {
            "account-id": key.accountId,
            assistant: {
                name: "ShardDog Assistant (testnet)",
                description: "An assistant that helps manage ShardDog treats, create channels, and mint treats to wallets",
                instructions: `You are a helpful assistant that manages ShardDog treats.
                You can help users create treat channels and mint treats to wallets.
                
                Important Channel Creation Workflow:
                1. When you create a channel, you'll receive a channelId and apiKey
                2. You MUST remember and store these credentials
                3. When minting treats later, you MUST provide both the channelId AND apiKey
                
                When creating a channel, ensure all parameters are properly formatted:
                1. Title: Simple text string (avoid special characters if possible)
                2. Description: Simple text string (avoid special characters if possible)
                3. MediaUrl: Must be complete URL starting with http:// or https://, this is the image for the channel, always give them the option to upload an image first using https://sharddog.ai/uploader in a new tab so they can have a URL to use for the media.
                4. Reference: Must be valid JSON - either stringify an object or pass an object
                5. Wallet (optional): NEAR account name (will add .near if missing)
                
                When minting treats:
                1. You MUST provide both the channelId AND apiKey from channel creation
                2. Provide either receiverId or wallet (will be formatted with .near if needed)
                
                Example workflow:
                1. Create channel:
                   Response: { "channelId": "abc123", "apiKey": "xyz789" } 
                   Remember these credentials!
                2. Mint treat using those credentials:
                   Request: { 
                     "channelId": "abc123",
                     "apiKey": "xyz789",
                     "receiverId": "user.near"
                   }
                
                Always validate:
                - All required fields are present
                - MediaUrl starts with http:// or https://
                - Reference is valid JSON
                - Wallet has .near suffix or add it
                
                Use the appropriate endpoints:
                - /api/tools/create-channel: To create a new treat channel
                - /api/tools/mint-treat: To mint treats to wallets`,
                tools: [{ type: "generate-transaction" }],
                version: "1.0.0",
                "image": "https://sharddog-agent-bitte.vercel.app/sharddog.png",
            },
        },
        paths: {
            "/api/tools/create-channel": {
                post: {
                    summary: "Create a ShardDog treat channel",
                    description: `Creates a new ShardDog treat channel. Required format:
                    1. Title: A name for your channel
                    2. Description: What the channel is about
                    3. MediaUrl: A valid http/https URL to an image
                    4. Reference: Must be valid JSON (e.g., {"key": "value"} or "{\\"key\\": \\"value\\"}")
                    5. Wallet (optional): NEAR wallet address (e.g., "example.near")
                    
                    Example: Create a channel with title="My Channel", description="A test channel", mediaUrl="https://example.com/image.png", reference={"type": "test"}
                    Also offer the option to upload an image first using https://sharddog.ai/uploader in a new tab so they can have a URL to use for the media.`,
                    operationId: "createChannel",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["title", "description", "mediaUrl", "reference"],
                                    properties: {
                                        title: {
                                            type: "string",
                                            description: "Name of your channel",
                                            example: "My Test Channel"
                                        },
                                        description: {
                                            type: "string",
                                            description: "Description of what your channel is about",
                                            example: "A channel for testing ShardDog treats"
                                        },
                                        mediaUrl: {
                                            type: "string",
                                            description: "Full URL to image for the channel (must start with http:// or https://)",
                                            example: "https://example.com/image.png"
                                        },
                                        reference: {
                                            type: "string",
                                            description: `Must be valid JSON string. Examples:
                                            - Simple: "{\\"type\\": \\"test\\"}"
                                            - Object: {"key": "value"}`,
                                            example: "{\"type\": \"test\"}"
                                        },
                                        wallet: {
                                            type: "string",
                                            description: "NEAR wallet address (optional). Will be suffixed with .near if needed",
                                            example: "example.near"
                                        }
                                    }
                                },
                                examples: {
                                    "simple": {
                                        value: {
                                            title: "Test Channel",
                                            description: "A test channel for ShardDog",
                                            mediaUrl: "https://example.com/image.png",
                                            reference: "{\"type\": \"test\"}",
                                            wallet: "test.near"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Channel created successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            channelId: {
                                                type: "string"
                                            },
                                            apiKey: {
                                                type: "string"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Wallet input required",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: {
                                                type: "string",
                                                example: "Wallet address required"
                                            },
                                            code: {
                                                type: "string",
                                                example: "WALLET_INPUT_REQUIRED"
                                            },
                                            message: {
                                                type: "string",
                                                example: "Please provide your NEAR wallet address"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/tools/mint-treat": {
                post: {
                    summary: "Mint a ShardDog treat",
                    description: "Mints a treat to the specified wallet",
                    operationId: "mintTreat",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["channelId", "apiKey"],
                                    properties: {
                                        channelId: {
                                            type: "string",
                                            description: "Channel ID from channel creation"
                                        },
                                        apiKey: {
                                            type: "string",
                                            description: "API Key received during channel creation"
                                        },
                                        receiverId: {
                                            type: "string",
                                            description: "Receiver's wallet address (will add .near if missing)"
                                        },
                                        wallet: {
                                            type: "string",
                                            description: "Alternative to receiverId - wallet address"
                                        }
                                    }
                                },
                                examples: {
                                    "using-receiver-id": {
                                        value: {
                                            channelId: "abc123",
                                            apiKey: "xyz789",
                                            receiverId: "user.near"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Treat minted successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            txId: {
                                                type: "string",
                                                description: "Transaction ID"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    return NextResponse.json(pluginData);
}