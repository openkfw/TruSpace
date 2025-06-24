// This file is necessary for correctly passing cookies
import { NextRequest, NextResponse } from "next/server";

import { getApiUrl } from "@/lib/services";

const apiUrl = getApiUrl();

export async function GET(
   request: NextRequest,
   { params }: { params: Promise<{ path: string[] }> }
) {
   const { path } = await params;
   return handleRequest(request, path, "GET");
}

export async function POST(
   request: NextRequest,
   { params }: { params: Promise<{ path: string[] }> }
) {
   const { path } = await params;
   return handleRequest(request, path, "POST");
}

export async function PUT(
   request: NextRequest,
   { params }: { params: Promise<{ path: string[] }> }
) {
   const { path } = await params;
   return handleRequest(request, path, "PUT");
}

export async function DELETE(
   request: NextRequest,
   { params }: { params: Promise<{ path: string[] }> }
) {
   const { path } = await params;
   return handleRequest(request, path, "DELETE");
}

async function handleRequest(
   request: NextRequest,
   path: string[],
   method: string
) {
   const pathString = path.join("/");
   const url = `${apiUrl}/${pathString}`;

   // Include original cookies
   const requestHeaders = new Headers(request.headers);

   try {
      const response = await fetch(url, {
         method,
         headers: requestHeaders,
         body:
            method !== "GET" && method !== "HEAD"
               ? await request.text()
               : undefined
      });

      // Create a new response with the same status and body
      const data = await response.text();

      // Create a new response that preserves cookies
      const newResponse = new NextResponse(data, {
         status: response.status,
         statusText: response.statusText,
         headers: response.headers
      });

      return newResponse;
   } catch (error) {
      console.error("API proxy error:", error);
      return NextResponse.json(
         { error: "Failed to proxy request" },
         { status: 500 }
      );
   }
}
