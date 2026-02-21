/**
 * @file Guardian Integrations Page
 * @description Link external financial apps for Sentinel protection
 */

"use client";

import { useState } from "react";
import { ServiceCard } from "@/components/guardian/ServiceCard";
import { LinkedIntegrationCard } from "@/components/guardian/LinkedIntegrationCard";
import { SecureCredentialModal } from "@/components/guardian/SecureCredentialModal";
import { SensitivitySlider } from "@/components/guardian/SensitivitySlider";
import { GUARDIAN_SERVICES, getServiceById } from "@/lib/guardian/services";
import { LinkedIntegration, SentinelSensitivity } from "@/lib/guardian/types";
import { maskSensitiveData } from "@/lib/guardian/encryption";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GuardianIntegrationsPage() {
  const [linkedIntegrations, setLinkedIntegrations] = useState<LinkedIntegration[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalSensitivity, setGlobalSensitivity] = useState<SentinelSensitivity>("standard");
  
  const handleSecureApp = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setIsModalOpen(true);
  };
  
  const handleSubmitCredentials = async (encryptedData: any) => {
    // TODO: Send encrypted data to backend API
    console.log("[ENCRYPTED CREDENTIALS]", encryptedData);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Create linked integration
    const service = getServiceById(selectedServiceId!);
    if (service) {
      const newIntegration: LinkedIntegration = {
        id: `integration_${Date.now()}`,
        serviceId: service.id,
        serviceName: service.name,
        maskedAccount: maskSensitiveData("1234567890", 4),
        linkedAt: Date.now(),
        sentinelActive: true,
        panicMode: false,
        sensitivity: globalSensitivity,
        lastChecked: Date.now(),
        status: "active",
      };
      
      setLinkedIntegrations((prev) => [...prev, newIntegration]);
    }
  };
  
  const handleTogglePanicMode = (integrationId: string, enabled: boolean) => {
    setLinkedIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId
          ? { ...integration, panicMode: enabled }
          : integration
      )
    );
    
    console.log(`[PANIC MODE] ${enabled ? "ENABLED" : "DISABLED"} for ${integrationId}`);
  };
  
  const handleManageIntegration = (integrationId: string) => {
    console.log("[MANAGE INTEGRATION]", integrationId);
    // TODO: Open management modal
  };
  
  const handleSensitivityChange = (sensitivity: SentinelSensitivity) => {
    setGlobalSensitivity(sensitivity);
    console.log("[SENSITIVITY CHANGED]", sensitivity);
    
    // Update all integrations
    setLinkedIntegrations((prev) =>
      prev.map((integration) => ({ ...integration, sensitivity }))
    );
  };
  
  const selectedService = selectedServiceId ? getServiceById(selectedServiceId) : null;
  const isServiceLinked = (serviceId: string) =>
    linkedIntegrations.some((integration) => integration.serviceId === serviceId);
  
  return (
    <div className="guardian-page">
      <div className="page-header">
        <Link href="/dashboard" className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </Link>
        
        <div className="header-content">
          <div className="header-icon">
            <Shield size={48} />
          </div>
          <h1>Guardian Integrations</h1>
          <p className="header-description">
            Link your external financial apps for Sentinel protection. All credentials are
            encrypted on your device before transmission.
          </p>
        </div>
      </div>
      
      {linkedIntegrations.length > 0 && (
        <section className="linked-section">
          <div className="section-header">
            <Lock size={24} />
            <h2>Protected Apps</h2>
            <span className="count-badge">{linkedIntegrations.length}</span>
          </div>
          
          <div className="linked-grid">
            {linkedIntegrations.map((integration) => (
              <LinkedIntegrationCard
                key={integration.id}
                integration={integration}
                onTogglePanicMode={handleTogglePanicMode}
                onManage={handleManageIntegration}
              />
            ))}
          </div>
        </section>
      )}
      
      <section className="sensitivity-section">
        <SensitivitySlider
          initialSensitivity={globalSensitivity}
          onChange={handleSensitivityChange}
        />
      </section>
      
      <section className="services-section">
        <div className="section-header">
          <Shield size={24} />
          <h2>Available Services</h2>
        </div>
        
        <div className="services-grid">
          {GUARDIAN_SERVICES.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isLinked={isServiceLinked(service.id)}
              onSecure={handleSecureApp}
            />
          ))}
        </div>
      </section>
      
      {selectedService && (
        <SecureCredentialModal
          service={selectedService}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedServiceId(null);
          }}
          onSubmit={handleSubmitCredentials}
        />
      )}
      
      <style jsx>{`
        .guardian-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1628 0%, #1a2942 100%);
          padding: 2rem;
        }
        
        .page-header {
          max-width: 1200px;
          margin: 0 auto 3rem;
        }
        
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
          margin-bottom: 2rem;
        }
        
        .back-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(-4px);
        }
        
        .header-content {
          text-align: center;
        }
        
        .header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #d4af37, #f0c952);
          border-radius: 16px;
          color: #0a1628;
          margin-bottom: 1.5rem;
        }
        
        .page-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin: 0 0 1rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .header-description {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.8);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }
        
        .linked-section,
        .sensitivity-section,
        .services-section {
          max-width: 1200px;
          margin: 0 auto 3rem;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          color: white;
        }
        
        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          padding: 0 0.5rem;
          background: linear-gradient(135deg, #d4af37, #f0c952);
          border-radius: 14px;
          color: #0a1628;
          font-weight: 700;
          font-size: 0.875rem;
        }
        
        .linked-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .guardian-page {
            padding: 1rem;
          }
          
          .page-header h1 {
            font-size: 1.75rem;
          }
          
          .header-description {
            font-size: 1rem;
          }
          
          .linked-grid,
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

