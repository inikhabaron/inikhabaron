'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch('/api/docs');
        const data = await response.json();
        setSpec(data);
      } catch (error) {
        console.error('Failed to load OpenAPI spec:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpec();
  }, []);

  if (loading || !spec) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading API Documentation...</div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <SwaggerUI 
        spec={spec} 
        url="/api/docs"
        persistAuthorization={true}
        defaultModelsExpandDepth={1}
        docExpansion="list"
      />
    </div>
  );
}
