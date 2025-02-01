import { NextResponse } from "next/server";

declare global {
    var channelStore: { [key: string]: { apiKey: string } };
}

export async function POST(req: Request) {
    try {
        const { channelId, receiverId, wallet, apiKey } = await req.json();
        
        // Use receiverId if present, otherwise use wallet
        const targetWallet = receiverId || wallet;
        
        console.log('Received request:', { 
            channelId, 
            receiverId, 
            wallet,
            hasApiKey: !!apiKey,
            targetWallet 
        });
        
        if (!channelId || !targetWallet || !apiKey) {
            console.error('Missing fields:', { 
                channelId, 
                receiverId: targetWallet,
                hasApiKey: !!apiKey 
            });
            return NextResponse.json({ 
                error: "Missing required fields. Need channelId, apiKey and either receiverId or wallet" 
            }, { status: 400 });
        }

        // Format wallet address if it doesn't have a valid suffix
        const formattedReceiverId = targetWallet.endsWith('.near') || targetWallet.endsWith('.testnet') 
            ? targetWallet 
            : `${targetWallet}.near`;

        const baseUrl = process.env.NODE_ENV === 'development' 
            ? 'http://localhost:3001' 
            : 'https://sharddog.ai';

        const requestBody = { receiverId: formattedReceiverId };
        console.log('Making API request:', {
            url: `${baseUrl}/api/receipts/mint/${channelId}`,
            body: requestBody,
            originalInput: { receiverId, wallet },
            formattedReceiverId,
            hasApiKey: !!apiKey
        });

        const response = await fetch(`${baseUrl}/api/receipts/mint/${channelId}`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorJson;
            try {
                errorJson = JSON.parse(errorText);
            } catch (e) {
                errorJson = { raw: errorText };
            }
            
            console.error('Mint treat failed:', {
                status: response.status,
                statusText: response.statusText,
                channelId,
                receiverId: formattedReceiverId,
                error: errorJson,
                headers: Object.fromEntries(response.headers.entries())
            });
            return NextResponse.json({ 
                error: errorJson.message || "Minting failed", 
                details: errorJson 
            }, { status: response.status });
        }

        const data = await response.json();
        console.log('Mint successful:', data);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Mint treat error:', error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 