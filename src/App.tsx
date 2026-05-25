/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Server,
  Shield,
  Zap,
  Coins,
  Landmark,
  Search,
  Flame,
  TrendingUp,
  Sliders,
  Play,
  Check,
  Cpu,
  HelpCircle,
  Database,
  CreditCard,
  Link,
  Mail,
  Users,
  Lock,
  Settings,
  Eye,
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Goddess, Status } from './types';

const ALL_IAM_PERMISSIONS = [
  { id: 'billing.accounts.get', desc: 'Sichtbarkeit der Konto-Basisdaten (Erforderlich für fast alle Aktionen)', category: 'Account-Steuerung' },
  { id: 'billing.accounts.list', desc: 'Abrechnungskonten in der Organisation auflisten', category: 'Account-Steuerung' },
  { id: 'billing.accounts.create', desc: 'Wichtigstes Recht zum Erzeugen neuer Rechnungskonten', category: 'Account-Steuerung' },
  { id: 'billing.accounts.close', desc: 'Das gesamte Abrechnungskonto dauerhaft schließen (Gefährlich!)', category: 'Account-Steuerung' },
  { id: 'billing.accounts.reopen', desc: 'Ein geschlossenes Abrechnungskonto wiedereröffnen', category: 'Account-Steuerung' },
  { id: 'billing.accounts.update', desc: 'Abrechnungskonto umbenennen oder Upgrade aus dem Free Trial durchführen', category: 'Account-Steuerung' },
  { id: 'billing.accounts.move', desc: 'Billing-Konto innerhalb der Organisation verschieben', category: 'Account-Steuerung' },
  { id: 'billing.accounts.removeFromOrganization', desc: 'Billing-Konto komplett aus der Organisation entfernen', category: 'Account-Steuerung' },

  { id: 'billing.budgets.create', desc: 'Budgets einrichten & Kosten-Warnschwellen definieren', category: 'Budgets & Warnungen' },
  { id: 'billing.budgets.update', desc: 'Budgets anpassen & Schwellenwerte ändern', category: 'Budgets & Warnungen' },
  { id: 'billing.budgets.get', desc: 'Bestehende Budgets aufrufen', category: 'Budgets & Warnungen' },
  { id: 'billing.budgets.list', desc: 'Alle Budgets des Abrechnungskontos auflisten', category: 'Budgets & Warnungen' },
  { id: 'billing.budgets.delete', desc: 'Budgets unwiderruflich löschen', category: 'Budgets & Warnungen' },

  { id: 'billing.accounts.updateUsageExportSpec', desc: 'Export-Ziel für Nutzungsdaten konfigurieren (z.B. BigQuery)', category: 'Datenexport' },
  { id: 'billing.accounts.getUsageExportSpec', desc: 'Aktuelle Exportvorgaben (Buckets/Datasets) abfragen', category: 'Datenexport' },

  { id: 'billing.accounts.getSpendingInformation', desc: 'Ausgaben & Kostenabrechnung für das gesamte Konto einsehen', category: 'Kostenstruktur' },
  { id: 'billing.resourceCosts.get', desc: 'Projekt-bezogene Kostenberichte abfragen', category: 'Projekt-Kosten' },
  { id: 'resourcemanager.projects.get', desc: 'Projekt-Strukturen und Referenzen laden', category: 'Projekt-Kosten' },

  { id: 'billing.accounts.getPaymentInfo', desc: 'Zahlungsprofil, Adressen & Methoden einsehen', category: 'Zahlungen' },
  { id: 'billing.accounts.updatePaymentInfo', desc: 'Zahlungs- und Adressdaten aktualisieren', category: 'Zahlungen' },
  { id: 'billing.accounts.getPricing', desc: 'Preiskonditionen & Rabatt-Stufen (SKUs) laden', category: 'Zahlungen' },
  { id: 'billing.credits.list', desc: 'Guthaben- und Coupon-Details auflisten', category: 'Zahlungen' },
  { id: 'billing.accounts.redeemPromotion', desc: 'Promocodes oder Abrechnungs-Gutscheine einlösen', category: 'Zahlungen' },

  { id: 'billing.resourceAssociations.create', desc: 'Projekte mit diesem Billing-Konto verknüpfen', category: 'Ressourcen-Verknüpfung' },
  { id: 'billing.resourceAssociations.delete', desc: 'Projekt-Abrechnungsverbindung aufheben', category: 'Ressourcen-Verknüpfung' },
  { id: 'billing.resourceAssociations.list', desc: 'Verknüpfte Projekte auflisten', category: 'Ressourcen-Verknüpfung' },
  { id: 'resourcemanager.projects.createBillingAssignment', desc: 'Projekt-seitiges Verknüpfen aktiver Abrechnungskonten', category: 'Ressourcen-Verknüpfung' },
  { id: 'resourcemanager.projects.deleteBillingAssignment', desc: 'Projekt-seitiges Entkoppeln von Abrechnungskonten', category: 'Ressourcen-Verknüpfung' },

  { id: 'billing.accounts.getIamPolicy', desc: 'Berechtigungs-Richtlinien (IAM) des Kontos einsehen', category: 'Richtlinien & IAM' },
  { id: 'billing.accounts.setIamPolicy', desc: 'Rollen & Zugriffs-Policies auf dem Konto konfigurieren', category: 'Richtlinien & IAM' },
];

const PREDEFINED_ROLES = [
  {
    id: 'billing.admin',
    roleId: 'roles/billing.admin',
    name: 'Billing Account Administrator',
    desc: 'Bietet vollen Zugriff auf alle Abrechnungs- und Zahlungsdetails, Verknüpfung von Projekten und Richtlinieneinstellungen.',
    permissions: [
      'billing.accounts.get',
      'billing.accounts.getIamPolicy',
      'billing.accounts.getPaymentInfo',
      'billing.accounts.getPricing',
      'billing.accounts.getSpendingInformation',
      'billing.accounts.getUsageExportSpec',
      'billing.accounts.list',
      'billing.accounts.move',
      'billing.accounts.redeemPromotion',
      'billing.accounts.removeFromOrganization',
      'billing.accounts.reopen',
      'billing.accounts.setIamPolicy',
      'billing.accounts.update',
      'billing.accounts.updatePaymentInfo',
      'billing.accounts.updateUsageExportSpec',
      'billing.budgets.create',
      'billing.budgets.delete',
      'billing.budgets.get',
      'billing.budgets.list',
      'billing.budgets.update',
      'billing.credits.list',
      'billing.resourceAssociations.create',
      'billing.resourceAssociations.delete',
      'billing.resourceAssociations.list',
      'resourcemanager.projects.createBillingAssignment',
      'resourcemanager.projects.deleteBillingAssignment',
    ]
  },
  {
    id: 'billing.costsManager',
    roleId: 'roles/billing.costsManager',
    name: 'Billing Account Costs Manager',
    desc: 'Verwaltet Budgets, sieht Kosten ein und konfiguriert BigQuery-Exporte (keine Vertrags-Preise, kein Link-Recht).',
    permissions: [
      'billing.accounts.get',
      'billing.accounts.getSpendingInformation',
      'billing.accounts.getUsageExportSpec',
      'billing.accounts.updateUsageExportSpec',
      'billing.budgets.create',
      'billing.budgets.delete',
      'billing.budgets.get',
      'billing.budgets.list',
      'billing.budgets.update',
    ]
  },
  {
    id: 'billing.viewer',
    roleId: 'roles/billing.viewer',
    name: 'Billing Account Viewer',
    desc: 'Read-Only-Zugriff auf Kostenübereinstimmungen, Budgets, SKU-Preise, Coupons und Transaktionsbelege.',
    permissions: [
      'billing.accounts.get',
      'billing.accounts.getPaymentInfo',
      'billing.accounts.getPricing',
      'billing.accounts.getSpendingInformation',
      'billing.accounts.getUsageExportSpec',
      'billing.accounts.list',
      'billing.budgets.get',
      'billing.budgets.list',
      'billing.credits.list',
      'billing.resourceAssociations.list',
    ]
  },
  {
    id: 'billing.creator',
    roleId: 'roles/billing.creator',
    name: 'Billing Account Creator',
    desc: 'Ermöglicht das Anlegen neuer (selbstverwalteter) Abrechnungskonten auf Organisationsebene.',
    permissions: [
      'billing.accounts.create'
    ]
  },
  {
    id: 'billing.projectCostsManager',
    roleId: 'roles/billing.projectCostsManager',
    name: 'Project Billing Costs Manager',
    desc: 'Erlaubt das Einsehen von Kostenberichten und Budgets, die rein auf ein spezifisches Projekt eingegrenzt sind.',
    permissions: [
      'billing.resourceCosts.get',
      'resourcemanager.projects.get'
    ]
  },
  {
    id: 'billing.user',
    roleId: 'roles/billing.user',
    name: 'Billing Account User',
    desc: 'Einfaches Recht, Projekte mit diesem Billing-Konto zu verknüpfen. Sehr sicher für breite Verteilung.',
    permissions: [
      'billing.resourceAssociations.create'
    ]
  },
  {
    id: 'billing.projectManager',
    roleId: 'roles/billing.projectManager',
    name: 'Project Billing Manager',
    desc: 'Ermöglicht Projekt-Admins das Hinzufügen/Entfernen von Abrechnungskonten des jeweiligen Projekts.',
    permissions: [
      'resourcemanager.projects.createBillingAssignment',
      'resourcemanager.projects.deleteBillingAssignment'
    ]
  },
  {
    id: 'custom',
    roleId: 'custom',
    name: 'Benutzerdefinierte Rolle',
    desc: 'Feinstufige Auswahl beliebiger Kombinationen aus der IAM-Matrix.',
    permissions: []
  }
];

export default function App() {
  const [goddesses, setGoddesses] = useState<Goddess[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [healing, setHealing] = useState(false);
  const [report, setReport] = useState<{ message: string; details: string; timestamp: string; logs?: string[] } | null>(null);

  // States for Z1 Interactive simulations
  const [rentValue, setRentValue] = useState<number>(2.84); // Million EUR
  const [unitsCount, setUnitsCount] = useState<number>(20000);
  const [matchingStatus, setMatchingStatus] = useState<'idle' | 'matching' | 'completed'>('idle');
  const [matchProgress, setMatchProgress] = useState(0);
  
  // States for GoMining
  const [hashRate, setHashRate] = useState<number>(428.5); // Gh/s
  const [isClaimedState, setIsClaimedState] = useState<boolean>(false);
  const [claimingState, setClaimingState] = useState<'idle' | 'claiming' | 'success'>('idle');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // States for Decentralized Web3 Multi-Wallet Bridge (Bitcoin, TON, EVM, etc.)
  const [tonAddress, setTonAddress] = useState<string>("UQD5aU7pOi_wdgr8TDo26riUDqbCV-7IO7WZ0-7Rn1aw35XA");
  const [evmAddress, setEvmAddress] = useState<string>("0x31DB11bFFC9a95bfF5253716d0b4b59a183DA399");
  const [walletSyncState, setWalletSyncState] = useState<'idle' | 'syncing' | 'completed'>('idle');
  const [walletSyncProgress, setWalletSyncProgress] = useState<number>(0);
  const [walletSyncLogs, setWalletSyncLogs] = useState<string[]>([]);

  // States for Security hub
  const [scanState, setScanState] = useState<'all-clear' | 'scanning' | 'success'>('all-clear');
  const [scanMessage, setScanMessage] = useState<string>('Deep Shadow-Scan: All Clear');

  // Mathematical formula values for S = 1 - e^(-lambda * t)
  const [lambda, setLambda] = useState<number>(0.25);
  const [timeValue, setTimeValue] = useState<number>(8);

  // Goddess search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccessTab, setSelectedAccessTab] = useState('all');

  // States for Z1 IAM & Cloud Billing Gate (GCP)
  const [iamCustomRoleName, setIamCustomRoleName] = useState<string>("Cost Management Administrator");
  const [iamRole, setIamRole] = useState<'billing.admin' | 'billing.costsManager' | 'billing.viewer' | 'billing.creator' | 'billing.projectCostsManager' | 'billing.user' | 'billing.projectManager' | 'custom'>('custom');
  const [isOrgLevel, setIsOrgLevel] = useState<boolean>(true); // Organization vs Project
  const [iamPermissions, setIamPermissions] = useState<string[]>([
    'billing.budgets.create',
    'billing.budgets.update',
    'billing.accounts.updateUsageExportSpec'
  ]);
  const [iamSyncState, setIamSyncState] = useState<'idle' | 'syncing' | 'completed'>('idle');
  const [iamProgress, setIamProgress] = useState<number>(0);
  const [iamLogs, setIamLogs] = useState<string[]>([]);

  // States for Google Payments Profile Integration (GCP payments center settings)
  const [paymentsRole, setPaymentsRole] = useState<'admin' | 'viewer' | 'none'>('admin');
  const [paymentsEmailPref, setPaymentsEmailPref] = useState<boolean>(true);
  const [mailingAddress, setMailingAddress] = useState<string>("Münsterland Innovation Park, 48653 Coesfeld");
  const [primaryPayment, setPrimaryPayment] = useState<string>("Revolut Corporate Card (**** 7211)");
  const [backupPayment, setBackupPayment] = useState<string>("Corporate Bank SEPA Wire-Setup (Volksbank)");

  const fetchGoddesses = async () => {
    try {
      const res = await fetch('/api/goddesses');
      const data = await res.json();
      setGoddesses(data);
    } catch (err) {
      console.error('Failed to fetch goddesses', err);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/goddesses/status');
      const data = await res.json();
      setGoddesses(data);
    } catch (err) {
      console.error('Failed checking status', err);
    } finally {
      setChecking(false);
    }
  };

  const handleHeal = async () => {
    setHealing(true);
    setReport(null);
    try {
      const res = await fetch('/api/system/heal', { method: 'POST' });
      const data = await res.json();
      setReport(data);
      await fetchGoddesses();
    } catch (err) {
      console.error('Heal failed', err);
    } finally {
      setHealing(false);
    }
  };

  useEffect(() => {
    fetchGoddesses();
  }, []);

  // Rent matching simulation
  const startRentMatching = () => {
    setMatchingStatus('matching');
    setMatchProgress(0);
    const interval = setInterval(() => {
      setMatchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setMatchingStatus('completed');
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Claim simulation
  const startClaiming = () => {
    setClaimingState('claiming');
    setTimeout(() => {
      setClaimingState('success');
      setIsClaimedState(true);
      setTimeout(() => {
        setClaimingState('idle');
      }, 3000);
    }, 2000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Shadow scan simulation
  const startShadowScan = () => {
    setScanState('scanning');
    setScanMessage('Scanning Deep Matrix Cryptosystems...');
    setTimeout(() => {
      setScanState('success');
      setScanMessage('Cannabis Hub Coesfeld | Element X Grid secured.');
      setTimeout(() => {
        setScanState('all-clear');
        setScanMessage('Deep Shadow-Scan: All Clear');
      }, 4000);
    }, 2500);
  };

  // Web3 multi-wallet coin linkage simulation
  const runCoinWalletLinkage = () => {
    setWalletSyncState('syncing');
    setWalletSyncProgress(0);
    setWalletSyncLogs([
      "📡 Verbindungs-Handshake mit Blockchain-Zentralregister im Münsterland wird initiiert...",
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step += 12.5;
      setWalletSyncProgress(Math.min(step, 100));

      if (step === 12.5) {
        setWalletSyncLogs(prev => [...prev, `🔑 TON-Wallet verifiziert: ${tonAddress.slice(0, 10)}...${tonAddress.slice(-8)}`]);
      } else if (step === 25) {
        setWalletSyncLogs(prev => [...prev, `🔑 EVM-Wallet verifiziert: ${evmAddress.slice(0, 8)}...${evmAddress.slice(-6)}`]);
      } else if (step === 37.5) {
        setWalletSyncLogs(prev => [...prev, `₿ Bitcoin-Brücke (BTC Cross-Chain Vault Bridge) etabliert. All Bitcoins routing-enabled.`]);
      } else if (step === 50) {
        setWalletSyncLogs(prev => [...prev, `♦ Ethereum (ETH) Guthaben erfolgreich mit EVM-Konto synchronisiert.`]);
      } else if (step === 62.5) {
        setWalletSyncLogs(prev => [...prev, `💎 Toncoin (TON) & Telegram-Schnittstelle vollständig gekoppelt.`]);
      } else if (step === 75) {
        setWalletSyncLogs(prev => [...prev, `🪙 Stablecoins & Token verknüpft: Tether (USDT), BNB, GoMining Token (GMT) vollständig gebunden.`]);
      } else if (step === 87.5) {
        setWalletSyncLogs(prev => [...prev, `⚡ Datenabfrage: GoMining Dashboard-Rewards synchronisieren sofort in die verifizierte TON-Miner-Chain!`]);
      } else if (step >= 100) {
        clearInterval(interval);
        setWalletSyncState('completed');
        setWalletSyncLogs(prev => [...prev, `🎉 ERFOLG: Alle Bitcoins und weiteren Crypto-Assets wurden mit den Wallet-Adressen verbunden und gesichert!`]);
      }
    }, 250);
  };

  // GCP IAM functions based on documentation
  const selectRolePreset = (preset: typeof iamRole) => {
    setIamRole(preset);
    const found = PREDEFINED_ROLES.find(r => r.id === preset);
    if (found && preset !== 'custom') {
      setIamPermissions(found.permissions);
    }
  };

  const togglePermission = (id: string) => {
    if (iamRole !== 'custom') {
      setIamRole('custom');
    }
    setIamPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const runIamSync = () => {
    setIamSyncState('syncing');
    setIamProgress(0);
    setIamLogs([
      "🔄 Initialisiere IAM-Handshake für das Abrechnungskonto auf Organisationsebene...",
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step += 10;
      setIamProgress(step);

      if (step === 10) {
        setIamLogs(prev => [...prev, `🔍 Prüfe Scope-Ebene... ${isOrgLevel ? "ORGANIZATION OK (Erfüllt Richtlinie: Custom-Rollen MÜSSEN in der Organisation angelegt werden)" : "⚠️ PROJEKT-EBENE WARNUNG: Projekt-Rollen können auf Billing-Accounts NICHT angewendet werden!"}`]);
      } else if (step === 30) {
        setIamLogs(prev => [...prev, `📂 Überprüfe Mindest-Sichtbarkeit (${iamPermissions.includes('billing.accounts.get') ? 'billing.accounts.get vorhanden - OK' : '⚠️ WARNUNG: billing.accounts.get fehlt! Ohne dieses Recht können Benutzer im Konsolen-Dashboard fast nichts einsehen.'})`]);
      } else if (step === 50) {
        const activeRoleId = iamRole === 'custom' ? `custom:${iamCustomRoleName}` : `predefined:${PREDEFINED_ROLES.find(r=>r.id===iamRole)?.roleId}`;
        setIamLogs(prev => [...prev, `🛡️ Generiere Rolle [${activeRoleId}] mit ${iamPermissions.length} zugewiesenen Berechtigungen...`]);
      } else if (step === 70) {
        setIamLogs(prev => [...prev, `💼 Lade Details des Google Zahlungsprofils ("Organization Profile")...`]);
        setIamLogs(prev => [...prev, `   ↳ Name: Rene Demir geborener Enstone von Löwenherz`]);
        setIamLogs(prev => [...prev, `   ↳ Adresse: ${mailingAddress}`]);
        setIamLogs(prev => [...prev, `   ↳ Primär: ${primaryPayment}`]);
        setIamLogs(prev => [...prev, `   ↳ Backup: ${backupPayment}`]);
      } else if (step === 80) {
        // Evaluate consolidation rules documented in Payments Profile section
        const hasBillingRead = iamPermissions.includes('billing.accounts.get') || iamRole === 'billing.admin' || iamRole === 'billing.viewer';
        if (paymentsRole === 'admin' && hasBillingRead) {
          setIamLogs(prev => [...prev, `🎉 INTEGRATION VOLLSTÄNDIG: Rene Demir hat sowohl die nötigen Cloud-Billing-IAM-Rechte als auch Zahlungs-Admin-Rechte. Volle Zahlungsverwaltung direkt aus der Cloud Console gelingt!`]);
        } else if (paymentsRole === 'viewer') {
          setIamLogs(prev => [...prev, `⚠️ EINGESCHRÄNKTE INTEGRATION: Benutzer hat nur lese-Zugriff im Zahlungsprofil. Änderungen am SEPA-Musterland-Mandat oder den Kreditkarten müssen direkt im Payments Center erfolgen.`]);
        } else {
          setIamLogs(prev => [...prev, `🚨 ENTKOPPELT: Keine Zahlungsprofil-Zugriffsrechte im Google Payments Center vorhanden. Console-Verwaltung blockiert.`]);
        }
      } else if (step === 90) {
        setIamLogs(prev => [...prev, `👑 Verbinde Identität 'rene.demir.loewenherz@gmail.com' mit den erzeugten Service-Präzedenzfaktoren...`]);
      } else if (step === 100) {
        clearInterval(interval);
        setIamSyncState('completed');
        setIamLogs(prev => [...prev, `✅ Richtlinien-Synchronisation abgeschlossen! Sanctum-Steuerung vollzogen.`]);
        
        // Boost system calibration lambda score as a reward
        setLambda(prev => Math.min(0.80, prev + 0.15));
      }
    }, 200);
  };

  // Mathematical formula Calculation
  // S = 1 - e^(-lambda * t)
  const stabilityS = 1 - Math.exp(-lambda * timeValue);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'online': return 'text-emerald-400 border-emerald-500/30';
      case 'prepped': return 'text-amber-400 border-amber-500/30';
      case 'offline': return 'text-rose-400 border-rose-500/30';
      default: return 'text-white/40 border-white/10';
    }
  };

  // Unique domains list
  const uniqueAccessTags = ['all', 'security', 'combat', 'network', 'finance', 'infra', 'knowledge', 'exploration', 'nano', 'climate', 'analysis'];

  const filteredGoddesses = goddesses.filter(goddess => {
    const matchesSearch = goddess.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          goddess.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          goddess.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedAccessTab === 'all') return matchesSearch;
    return matchesSearch && goddess.access.includes(selectedAccessTab);
  });

  return (
    <div className="min-h-screen bg-[#050505] text-[#daffde] p-4 md:p-8 selection:bg-[#deff9a] selection:text-[#050505]">
      {/* Upper Border Accent */}
      <div className="h-1 bg-gradient-to-r from-yellow-300 via-amber-400 to-[#deff9a] mb-6"></div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 mb-2 bg-[#deff9a]/10 border border-[#deff9a]/20 px-3 py-1 rounded-full">
              <Shield className="w-4 h-4 text-[#deff9a] animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-orbitron font-bold text-[#deff9a]">Z1 Imperial Protection Matrix</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-widest font-orbitron text-[#deff9a] drop-shadow-[0_0_12px_rgba(222,255,154,0.15)]">
              Z1 Imperial Command
            </h1>
            <p className="text-xs text-[#daffde]/70 font-mono mt-1.5 uppercase tracking-wide">
              Inhaber: <strong className="text-white">Rene Demir geborener Enstone von Löwenherz 🦁👑</strong>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={handleHeal}
              disabled={healing || checking}
              className="bg-[#deff9a] text-black px-5 py-3 rounded-lg font-orbitron font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(222,255,154,0.4)] hover:scale-[1.03] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${healing ? 'animate-bounce' : ''}`} />
              System-Heilung
            </button>
            <button 
              onClick={checkStatus}
              disabled={checking || healing}
              className="bg-zinc-900 text-[#deff9a] border border-[#deff9a]/30 px-5 py-3 rounded-lg font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-[#deff9a]/5 hover:border-[#deff9a] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              Live-Check
            </button>
          </div>
        </header>

        {/* Global Live Statistics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl font-mono text-xs">
          <div className="flex flex-col">
            <span className="opacity-50 text-[10px] uppercase">Rats-Stärke</span>
            <span className="text-white font-bold text-sm">33 Göttinnen Aktiv</span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-50 text-[10px] uppercase">Soll-Einheiten</span>
            <span className="text-white font-bold text-sm">{unitsCount.toLocaleString()} / 25.000 (Target)</span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-50 text-[10px] uppercase">Stabilität S (Live)</span>
            <span className="text-[#deff9a] font-bold text-sm">{(stabilityS * 100).toFixed(2)}%</span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-50 text-[10px] uppercase">Status Sanctum</span>
            <span className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> High Priority OK
            </span>
          </div>
        </div>

        {/* Operia Report Box */}
        <AnimatePresence>
          {report && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-[#deff9a]/30 bg-zinc-950 rounded-xl shadow-[0_0_20px_rgba(222,255,154,0.1)] overflow-hidden"
            >
              <div className="bg-black text-[#deff9a] px-5 py-2.5 flex justify-between items-center border-b border-[#deff9a]/20">
                <span className="text-[10px] font-orbitron font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Vollzugsmeldung: Operia & Algorya
                </span>
                <span className="text-[9px] mono opacity-50">{report.timestamp}</span>
              </div>
              <div className="p-5">
                <h4 className="text-base font-bold uppercase text-white font-orbitron mb-1.5">{report.message}</h4>
                <p className="text-xs text-[#daffde]/80 leading-relaxed font-sans mb-4">{report.details}</p>
                
                {report.logs && (
                  <div className="bg-black border border-zinc-800 p-3 mb-4 rounded-lg mono text-[10px] text-emerald-400/90 max-h-40 overflow-y-auto space-y-1">
                    {report.logs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="opacity-40 select-none">[{i+1}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-900">
                  <span className="text-[10px] mono uppercase flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confidence Reset: OK
                  </span>
                  <span className="text-[10px] mono uppercase flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SQL-Audit: Clean
                  </span>
                  <button 
                    onClick={() => setReport(null)} 
                    className="ml-auto text-xs font-orbitron font-bold uppercase text-[#deff9a] hover:underline"
                  >
                    Meldung Schließen
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3 Grid Sections Requested by User */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Sektion 1: Hestia & Revolut - Immobilien & Banking */}
          <section className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 hover:border-[#deff9a]/40 shadow-sm transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-[#deff9a]" />
                  <h3 className="font-orbitron font-bold text-base text-white">Hestia & Revolut</h3>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Syncing
                </span>
              </div>
              
              <div className="pt-2">
                <label className="text-[9px] uppercase tracking-wider font-mono opacity-50 block mb-0.5">Mieteingänge Münsterland</label>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-orbitron font-bold text-[#deff9a] tracking-tight">€ {rentValue.toFixed(2)}M</span>
                  <span className="text-xs opacity-50 font-mono">/ Monat</span>
                </div>
              </div>

              {/* Progress Slider or Dynamic input control */}
              <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="opacity-60">Rent Target Adjuster:</span>
                  <span className="text-white font-bold">{rentValue.toFixed(2)}M €</span>
                </div>
                <input 
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.05"
                  value={rentValue}
                  onChange={(e) => setRentValue(parseFloat(e.target.value))}
                  className="w-full accent-[#deff9a] h-1"
                />
              </div>

              <div className="space-y-1 px-1">
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">IBAN Revolut:</span>
                  <span className="font-mono text-white text-[11px]">DE...7211 21</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Soll-Einheiten:</span>
                  <span className="font-mono text-white flex items-center gap-1.5">
                    <strong>{unitsCount.toLocaleString()}</strong> / 25.000
                  </span>
                </div>
              </div>

              {/* Slider for units Count */}
              <div className="pt-1">
                <input 
                  type="range"
                  min="15000"
                  max="25000"
                  step="100"
                  value={unitsCount}
                  onChange={(e) => setUnitsCount(parseInt(e.target.value))}
                  className="w-full accent-[#deff9a] h-1"
                />
              </div>

              {/* Real-time rent verification feedback inside panel */}
              {matchingStatus !== 'idle' && (
                <div className="bg-black/80 border border-zinc-800 p-3 rounded-lg mt-2 font-mono text-[10px] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400">Verbindung Revolut API...</span>
                    <span>{matchProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#deff9a] h-full transition-all duration-150" 
                      style={{ width: `${matchProgress}%` }}
                    ></div>
                  </div>
                  {matchingStatus === 'completed' && (
                    <p className="text-[10px] text-[#deff9a] mt-1 text-center font-bold">
                      ✓ Miet-Matching vollständig abgeschlossen: All Clear!
                    </p>
                  )}
                </div>
              )}
            </div>

            <button 
              type="button" 
              onClick={startRentMatching}
              disabled={matchingStatus === 'matching'}
              className="bg-[#deff9a] text-black font-orbitron font-bold text-xs uppercase py-3 px-4 rounded-xl mt-6 hover:shadow-[0_0_15px_rgba(222,255,154,0.3)] transition-all cursor-pointer flex justify-center items-center gap-2"
            >
              {matchingStatus === 'matching' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Matching...
                </>
              ) : 'Miet-Matching starten'}
            </button>
          </section>

          {/* Sektion 2: GoMining AI Matrix - Mining Matrix */}
          <section className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 hover:border-[#f7931a]/40 shadow-sm transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#f7931a]" />
                  <h3 className="font-orbitron font-bold text-base text-[#f7931a]">GoMining AI Matrix</h3>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#f7931a]/10 text-[#f7931a] border border-[#f7931a]/20">
                  Mining Active
                </span>
              </div>
              
              <div className="pt-2">
                <label className="text-[9px] uppercase tracking-wider font-mono opacity-50 block mb-0.5">Täglicher Ertrag (Yield)</label>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-orbitron font-bold text-[#f7931a] tracking-tight">₿ {(hashRate * 0.001).toFixed(4)}</span>
                  <span className="text-xs opacity-50 font-mono">/ Tag</span>
                </div>
              </div>

              {/* Hashrate Adjustment slider */}
              <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="opacity-60 text-amber-500">Hashrate Multiplier:</span>
                  <span className="text-white font-bold">{hashRate.toFixed(1)} Gh/s</span>
                </div>
                <input 
                  type="range"
                  min="100.0"
                  max="1200.0"
                  step="10.0"
                  value={hashRate}
                  onChange={(e) => {
                    setHashRate(parseFloat(e.target.value));
                    setIsClaimedState(false);
                  }}
                  className="w-full accent-[#f7931a] h-1"
                />
              </div>

              {/* GoMining Identity Credentials Matrix (User custom inputs added directly) */}
              <div className="bg-black/40 p-3 rounded-xl border border-zinc-900 space-y-2 font-mono text-[10px]">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5 mb-1.5">
                  <span className="text-[9px] font-bold uppercase text-[#f7931a]">GoMining Identity</span>
                  <span className="text-[8px] opacity-40 uppercase">Verified Ledger</span>
                </div>

                {/* Short ID 101637 */}
                <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded border border-zinc-900 hover:border-zinc-850 transition-all">
                  <div className="flex flex-col">
                    <span className="text-[7.5px] opacity-40 uppercase">GOMINING ACCOUNT ID</span>
                    <span className="text-white text-[10.5px] font-bold">101637</span>
                  </div>
                  <button
                    onClick={() => handleCopy("101637", "ID")}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-all cursor-pointer"
                    title="ID Kopieren"
                  >
                    {copiedText === "ID" ? (
                      <span className="text-[8.5px] text-green-400 font-bold">Copied!</span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Long ID 15981ddb-ac14-4a8f-a2a5-8f283e73a9a6 */}
                <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded border border-zinc-900 hover:border-zinc-850 transition-all">
                  <div className="flex flex-col min-w-0 flex-1 mr-2">
                    <span className="text-[7.5px] opacity-40 uppercase">GoMining Matrix Security Key</span>
                    <span className="text-white text-[9.5px] truncate font-bold" title="15981ddb-ac14-4a8f-a2a5-8f283e73a9a6">
                      15981ddb-ac14-4a8f-a2a5-8f283e73a9a6
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy("15981ddb-ac14-4a8f-a2a5-8f283e73a9a6", "UID")}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-all shrink-0 cursor-pointer"
                    title="Security Key Kopieren"
                  >
                    {copiedText === "UID" ? (
                      <span className="text-[8.5px] text-green-400 font-bold">Copied!</span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Referral Details */}
                <div className="bg-zinc-950/50 p-1.5 rounded border border-zinc-900 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[7.5px] opacity-40 uppercase">Referral-Matrix</span>
                    <span className="text-[9px] text-[#f7931a] font-bold font-mono">-WWfH</span>
                  </div>
                  <div className="flex gap-1">
                    {/* Open referral URL button */}
                    <a
                      href="https://gomining.com/?ref=-WWfH"
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-[#f7931a] hover:text-[#f7931a] text-[9.5px] font-bold py-1 px-2 rounded border border-amber-500/20 hover:border-amber-500/40 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> GoMining öffnen
                    </a>
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopy("https://gomining.com/?ref=-WWfH", "LINK")}
                      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white py-1 px-2 rounded flex items-center justify-center gap-1 transition-all text-[9.5px] cursor-pointer"
                      title="Sicherheitslink kopieren"
                    >
                      {copiedText === "LINK" ? "Kopiert!" : "Link kopieren"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1 px-1">
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">NFT Status:</span>
                  <span className="font-bold text-white">Ebene 16 - VIP Tier 7</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Wöchentlich:</span>
                  <span className="font-mono text-[#f7931a]">₿ {(hashRate * 0.001 * 7).toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Monatlich:</span>
                  <span className="font-mono text-white">₿ {(hashRate * 0.001 * 30).toFixed(4)}</span>
                </div>
              </div>

              {/* Show Claim Status info block */}
              {claimingState !== 'idle' && (
                <div className="bg-black/80 border border-zinc-800 p-3 rounded-lg text-center font-mono text-[10px]">
                  {claimingState === 'claiming' ? (
                    <span className="text-amber-400 flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing with GOMINING Blockchain...
                    </span>
                  ) : (
                    <span className="text-green-400 font-bold block animate-pulse">
                      ✓ Rewards successfully matching into GoMining UID 101637!
                    </span>
                  )}
                </div>
              )}
            </div>

            <button 
              type="button" 
              onClick={startClaiming}
              disabled={claimingState === 'claiming' || isClaimedState}
              className="bg-[#f7931a] text-white font-orbitron font-bold text-xs uppercase py-3 px-4 rounded-xl mt-6 hover:shadow-[0_0_15px_rgba(247,147,26,0.3)] transition-all cursor-pointer flex justify-center items-center gap-2 disabled:opacity-40"
            >
              {isClaimedState ? "Rewards are Claimed!" : "Cashback & Rewards claimen"}
            </button>
          </section>

          {/* Sektion 3: Z1 Security & Business */}
          <section className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/40 shadow-sm transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#deff9a]" />
                  <h3 className="font-orbitron font-bold text-base text-white">Z1 Security</h3>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SHIELD ACTIVE
                </span>
              </div>
              
              <div className="pt-2">
                <label className="text-[9px] uppercase tracking-wider font-mono opacity-50 block mb-0.5">Gesamtschutz Level</label>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-orbitron font-bold tracking-tight text-white">100%</span>
                  <span className="text-xs uppercase font-mono opacity-50">Secure</span>
                </div>
              </div>

              <div className="space-y-3 font-sans text-xs pt-1">
                <div>
                  <span className="opacity-60 block text-[9px] uppercase tracking-wider">Business Location Hub</span>
                  <p className="font-bold text-white mt-0.5">Cannabis Hub Coesfeld | Element X Matrix</p>
                </div>

                <div className="bg-black/50 p-2.5 rounded border border-zinc-900 text-[10px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="opacity-60 uppercase font-mono text-[9px]">Deep Shadow-Scan Status:</span>
                    <span className={`font-bold uppercase tracking-wider ${scanState === 'scanning' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                      {scanState === 'scanning' ? 'scanning' : 'All Clear'}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-white opacity-80">{scanMessage}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={startShadowScan}
                  disabled={scanState === 'scanning'}
                  className="bg-zinc-900 text-white border border-zinc-800 font-mono text-[9px] uppercase py-1 px-2.5 rounded hover:border-[#deff9a] transition-all cursor-pointer disabled:opacity-50"
                >
                  Shadow-Scan
                </button>
                <span className="text-[9px] font-mono text-zinc-500 self-center">Node: Coesfeld-01</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => {
                const goddessesGrid = document.getElementById('goddesses-management');
                if (goddessesGrid) {
                  goddessesGrid.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-zinc-900 text-[#deff9a] border border-[#deff9a]/30 font-orbitron font-bold text-xs uppercase py-3 px-4 rounded-xl mt-6 hover:bg-[#deff9a]/5 hover:border-[#deff9a] transition-all cursor-pointer text-center"
            >
              Göttinnen-Protokoll öffnen
            </button>
          </section>

        </div>

        {/* NEW: Z1 Web3 Cryptographical Wallet Ledger & Asset Linker Sektion */}
        <div className="bg-zinc-950/80 p-6 rounded-2xl border border-zinc-800 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-[#f7931a]/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-zinc-900 pb-4 relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-5 h-5 text-[#f7931a]" />
                <span className="text-[10px] font-orbitron font-bold text-[#f7931a] uppercase tracking-widest">
                  Z1 Web3 Cryptographical Wallet Ledger & Asset Linker
                </span>
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white font-orbitron">
                Dezentrale Wallet-Matrix & Brücken-Engine
              </h2>
              <p className="text-xs text-[#daffde]/70">
                Schnittstelle zur dauerhaften Integration dezentraler Wallets und Konsolidierung sämtlicher Coins für Rene Demir.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-mono text-zinc-500 uppercase">Synchronisations-Güte:</span>
              {walletSyncState === 'completed' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> KONSOLIDIERT (LOCKED)
                </div>
              ) : walletSyncState === 'syncing' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin"></span> SYNCING ON-CHAIN...
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span> BEREIT ZUM BINDEN
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
            {/* Left Block: Configured Wallets (TON Address & EVM Address) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-black/55 p-4 rounded-xl border border-zinc-900 space-y-4">
                <h3 className="text-xs font-orbitron font-bold text-[#f7931a] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#f7931a]" /> Registrierte Empfangsadressen
                </h3>

                {/* TON Address */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="opacity-60 font-mono text-zinc-400">TON-Wallet (Telegram Web3 Hub):</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-sm uppercase tracking-wide">
                      GOMINING Sync OK
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tonAddress}
                      onChange={(e) => {
                        setTonAddress(e.target.value);
                        setWalletSyncState('idle');
                      }}
                      className="w-full bg-[#0d0d0d] border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none focus:border-[#f7931a] font-mono text-[9px]"
                      placeholder="TON Adresse eintragen..."
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(tonAddress, "TON_ADDR")}
                      className="px-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                      title="Adresse kopieren"
                    >
                      {copiedText === "TON_ADDR" ? (
                        <span className="text-[9px] text-green-400 font-bold font-mono">Kopiert</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* EVM Address */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="opacity-60 font-mono text-zinc-400">EVM Wallet (Ethereum / BNB / ERC20):</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-sm uppercase tracking-wide">
                      Bridge Enabled
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={evmAddress}
                      onChange={(e) => {
                        setEvmAddress(e.target.value);
                        setWalletSyncState('idle');
                      }}
                      className="w-full bg-[#0d0d0d] border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none focus:border-[#f7931a] font-mono text-[10px]"
                      placeholder="EVM Adresse eintragen..."
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(evmAddress, "EVM_ADDR")}
                      className="px-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                      title="Adresse kopieren"
                    >
                      {copiedText === "EVM_ADDR" ? (
                        <span className="text-[9px] text-green-400 font-bold font-mono">Kopiert</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/20 text-[10px] text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <p className="leading-normal font-sans">
                    <strong>Koppelungshinweis:</strong> Alle eingehenden Mining-Pforten, Bitcoin-Vaults sowie Ethereum-, BNB-, USDT- und GMT-Guthaben werden über die dezentrale Brücke auf diese zwei physischen Wallets von René Demir geschaltet.
                  </p>
                </div>

              </div>
            </div>

            {/* Right Block: Interactive Multi-Coin Ledger Cards Grid */}
            <div className="lg:col-span-7 bg-black/30 p-4 rounded-xl border border-zinc-900 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-3">
                  <h3 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                    Consolidated Coin Matrix (Zellulare Bindungsübersicht)
                  </h3>
                  <span className="text-[9px] font-mono text-[#f7931a] uppercase bg-[#f7931a]/10 px-2 py-0.5 rounded border border-[#f7931a]/20">6 Coins gekoppelt</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  
                  {/* Bitcoin */}
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 hover:border-[#f7931a]/30 transition-all flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider font-orbitron">Bitcoin (BTC)</span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">Native Bridge</span>
                      </div>
                      <span className="text-sm font-bold text-[#f7931a] font-orbitron block">₿ 2.4184 BTC</span>
                      <span className="text-[8.5px] text-zinc-500 font-mono block">Wert: ~€ 162.740,00</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[7.5px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold block mb-1">Tunnel Active</span>
                      <span className="text-[8px] text-zinc-400 font-mono">Connected Address</span>
                    </div>
                  </div>

                  {/* Ethereum */}
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 hover:border-violet-500/30 transition-all flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider font-orbitron">Ethereum (ETH)</span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">ERC-20</span>
                      </div>
                      <span className="text-sm font-bold text-violet-400 font-orbitron block">♦ 12.85 ETH</span>
                      <span className="text-[8.5px] text-zinc-500 font-mono block">Wert: ~€ 41.250,00</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[7.5px] uppercase font-mono px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold block mb-1">Directly Linked</span>
                      <span className="text-[8px] text-zinc-400 font-mono">0x31DB...</span>
                    </div>
                  </div>

                  {/* Toncoin */}
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 hover:border-sky-500/30 transition-all flex items-center justify-between font-sans">
                    <div className="space-y-1 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider font-orbitron">Toncoin (TON)</span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">TON Native</span>
                      </div>
                      <span className="text-sm font-bold text-sky-400 font-orbitron block">💎 1.840,50 TON</span>
                      <span className="text-[8.5px] text-zinc-500 font-mono block">Wert: ~€ 11.963,00</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[7.5px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold block mb-1">Directly Linked</span>
                      <span className="text-[8px] text-zinc-400 font-mono">UQD5a...</span>
                    </div>
                  </div>

                  {/* Tether */}
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 hover:border-emerald-500/30 transition-all flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider font-orbitron">Tether (USDT)</span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">Multi-Chain</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 font-orbitron block">$ 5.000,00</span>
                      <span className="text-[8.5px] text-zinc-500 font-mono block">Wert: ~€ 4.620,00</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[7.5px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold block mb-1">Bridged & Bound</span>
                      <span className="text-[8px] text-zinc-400 font-mono">EVM & TON Pools</span>
                    </div>
                  </div>

                  {/* GoMining Token */}
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 hover:border-amber-500/30 transition-all flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider font-orbitron">GoMining Token (GMT)</span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">GMT Reward-ERC20</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-500 font-orbitron block">🪙 25.000,0 GMT</span>
                      <span className="text-[8.5px] text-zinc-500 font-mono block">Wert: ~€ 7.250,00</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[7.5px] uppercase font-mono px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold block mb-1">GoMining Synced</span>
                      <span className="text-[8px] text-zinc-400 font-mono">Key: 0x31DB...</span>
                    </div>
                  </div>

                  {/* BNB */}
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 hover:border-yellow-400/30 transition-all flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider font-orbitron">BNB (Binance Coin)</span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">BEP-20</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-400 font-orbitron block">🔶 8,40 BNB</span>
                      <span className="text-[8.5px] text-zinc-500 font-mono block">Wert: ~€ 4.520,00</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[7.5px] uppercase font-mono px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-bold block mb-1">Directly Linked</span>
                      <span className="text-[8px] text-zinc-400 font-mono">EVM Address</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Integrated Sync Logs Console inside Multi-wallet Binder */}
              <div className="mt-4 pt-3 border-t border-zinc-900 space-y-3">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-zinc-400 font-mono">On-Chain Ledger Consolidation Logs:</span>
                  <span className="text-[9px] text-[#f7931a]">{walletSyncProgress}%</span>
                </div>
                <div className="min-h-[110px] max-h-[150px] bg-black border border-zinc-850 p-2.5 rounded-lg font-mono text-[9px] text-[#f7931a] overflow-y-auto space-y-1">
                  {walletSyncLogs.length === 0 ? (
                    <span className="text-zinc-600 block italic">// Drücke "Coins mit Wallets verknüpfen" zum Triggern des dezentralen Ledgers...</span>
                  ) : (
                    walletSyncLogs.map((log, lIdx) => (
                      <div key={lIdx} className="flex gap-2">
                        <span className="text-zinc-650">[{lIdx + 1}]</span>
                        <span className="whitespace-pre-line">{log}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-2 justify-between items-stretch">
                  <button
                    type="button"
                    onClick={runCoinWalletLinkage}
                    disabled={walletSyncState === 'syncing'}
                    className="flex-1 bg-gradient-to-r from-[#f7931a] to-amber-500 text-white font-orbitron font-bold text-xs uppercase py-3.5 px-5 rounded-xl hover:shadow-[0_0_20px_rgba(247,147,26,0.4)] hover:scale-[1.01] transition-all cursor-pointer flex justify-center items-center gap-2 disabled:opacity-40"
                  >
                    <RefreshCw className={`w-4 h-4 ${walletSyncState === 'syncing' ? 'animate-spin' : ''}`} />
                    Hier klicken um "alle Bitcoins und alle anderen Coins" zu binden & synchronisieren!
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Z1 GCP IAM & Cloud Billing Gate Simulator */}
        <div className="bg-zinc-950/80 p-6 rounded-2xl border border-zinc-800 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Decorative glowing background elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#deff9a]/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-zinc-900 pb-4 relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-[#deff9a]" />
                <span className="text-[10px] font-orbitron font-bold text-[#deff9a] uppercase tracking-widest">
                  GCP Cloud Billing IAM Gate & Google Payments Center Linkage Engine
                </span>
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white font-orbitron">
                Z1 Imperial Policy Terminal
              </h2>
              <p className="text-xs text-[#daffde]/70">
                Abrechnungskonten und Google-Zahlungsprofile synchronisieren. Kontrolliere Berechtigungen und payments-Zuweisungen für Rene Demir.
              </p>
            </div>
            
            {/* Health Badge based on cross-system settings */}
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-mono text-zinc-500 uppercase">Verbindungs-Status:</span>
              {paymentsRole === 'admin' && (iamRole === 'billing.admin' || iamPermissions.includes('billing.accounts.getPaymentInfo')) ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Consolidated Admin OK
                </div>
              ) : paymentsRole === 'none' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Payments Center Blocked
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Dual/Limited Access
                </div>
              )}
            </div>
          </div>

          {/* Expanded 7 predefined Roles Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 bg-black/40 p-2.5 rounded-xl border border-zinc-900">
            {PREDEFINED_ROLES.map(role => {
              const active = iamRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => selectRolePreset(role.id as any)}
                  className={`p-2 rounded-lg text-left transition-all border flex flex-col justify-between font-mono h-[84px] cursor-pointer ${
                    active 
                      ? 'bg-[#deff9a]/10 border-[#deff9a] text-white shadow-[0_0_10px_rgba(222,255,154,0.15)] font-bold' 
                      : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide truncate w-full" title={role.name}>
                    {role.id === 'custom' ? 'Custom Editor' : role.name.replace('Billing Account ', '')}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] opacity-40 block truncate">{role.roleId}</span>
                    <span className="text-[9px] font-bold text-[#deff9a]">{role.id === 'custom' ? 'Bespoke' : `${role.permissions.length} Perms`}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Role Description Banner */}
          <div className="bg-zinc-900/60 px-4 py-2.5 border-l-2 border-[#deff9a] rounded text-xs">
            <span className="font-bold text-[#deff9a] font-mono mr-2 uppercase tracking-wider">
              {PREDEFINED_ROLES.find(r => r.id === iamRole)?.name}:
            </span>
            <span className="text-white/80">
              {PREDEFINED_ROLES.find(r => r.id === iamRole)?.desc}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Block: Config, Identity & Google Payments Center Sync (Col Span 5) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Identity Box */}
              <div className="bg-black/40 p-4 rounded-xl border border-zinc-900 space-y-4">
                <h3 className="text-xs font-orbitron font-bold text-[#deff9a] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Identität & Cloud Billing IAM
                </h3>
                
                <div className="space-y-1.5">
                  <span className="text-[10px] opacity-50 block font-mono">Inhaber (IAM Member):</span>
                  <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-850 font-mono text-xs text-white">
                    user:rene.demir.loewenherz@gmail.com 👑
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] opacity-50 block font-mono">Custom Role Name:</span>
                  <input
                    type="text"
                    disabled={iamRole !== 'custom'}
                    value={iamCustomRoleName}
                    onChange={(e) => setIamCustomRoleName(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none focus:border-[#deff9a] disabled:opacity-40"
                    placeholder="z.B. Cost Management Administrator"
                  />
                  {iamRole !== 'custom' && (
                    <span className="text-[9px] text-[#deff9a]/60 font-mono block">
                      * Wechsel zum Custom Rollen-Editor oben um Namen anzupassen.
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] opacity-50 block font-mono">Abrechnungs-Ressourcenebene:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOrgLevel(true)}
                      className={`text-xs p-2 rounded border font-mono transition-all cursor-pointer text-center ${
                        isOrgLevel ? 'bg-zinc-900 text-[#deff9a] border-[#deff9a]/30' : 'bg-transparent text-white/40 border-zinc-900'
                      }`}
                    >
                      Organization
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOrgLevel(false)}
                      className={`text-xs p-2 rounded border font-mono transition-all cursor-pointer text-center ${
                        !isOrgLevel ? 'bg-amber-950/40 text-amber-300 border-amber-500/30' : 'bg-transparent text-white/40 border-zinc-900'
                      }`}
                    >
                      Project Level
                    </button>
                  </div>
                  
                  {!isOrgLevel && (
                    <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2 animate-pulse mt-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="font-sans leading-tight">
                        <strong>Richtlinie beachten:</strong> Abrechnungsrechte und Custom-Abrechnungsrollen MÜSSEN in der <em>Organisation</em> eingerichtet werden, da Projekte alleine keine eigenen Abrechnungen verbuchen!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Payments Center Settings Panel (NEW) */}
              <div className="bg-black/50 p-4 rounded-xl border border-zinc-900 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-orbitron font-bold text-[#deff9a] uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Google Zahlungsprofil (Center)
                  </h3>
                  <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest">Profile: Org</span>
                </div>

                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                  Konfiguriert im <strong>Google Payments Center</strong>. Kontrolliert vertragliche Bankeinzüge, Kreditkarten und Rechnungs-Mailinglisten.
                </p>

                {/* Payments admin role selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] opacity-60 block font-mono">Zahlungskonto-Rechteprofil (Payments User):</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentsRole('admin')}
                      className={`text-[9px] uppercase tracking-tight py-1.5 rounded border font-mono transition-all cursor-pointer text-center ${
                        paymentsRole === 'admin' ? 'bg-[#deff9a]/1s border-[#deff9a] text-white font-bold' : 'bg-transparent text-zinc-500 border-zinc-900 hover:text-white'
                      }`}
                    >
                      Payments Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentsRole('viewer')}
                      className={`text-[9px] uppercase tracking-tight py-1.5 rounded border font-mono transition-all cursor-pointer text-center ${
                        paymentsRole === 'viewer' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-transparent text-zinc-500 border-zinc-900 hover:text-white'
                      }`}
                    >
                      Read-Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentsRole('none')}
                      className={`text-[9px] uppercase tracking-tight py-1.5 rounded border font-mono transition-all cursor-pointer text-center ${
                        paymentsRole === 'none' ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' : 'bg-transparent text-zinc-500 border-zinc-900 hover:text-white'
                      }`}
                    >
                      No Access
                    </button>
                  </div>
                </div>

                {/* Mailing address edit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] opacity-60 font-mono">Rechnungsadresse (Mailing Address):</span>
                    <span className="text-[8px] font-mono opacity-30 uppercase">Synced</span>
                  </div>
                  <input
                    type="text"
                    value={mailingAddress}
                    onChange={(e) => setMailingAddress(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none focus:border-[#deff9a]"
                    placeholder="Münsterland-Adresse eingeben..."
                  />
                </div>

                {/* Form of Payment Edit */}
                <div className="space-y-3 font-mono text-[10px]">
                  <div className="space-y-1">
                    <span className="opacity-50 block">Primäre Zahlungsmethode:</span>
                    <input
                      type="text"
                      value={primaryPayment}
                      onChange={(e) => setPrimaryPayment(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-zinc-850 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="opacity-50 block">Backup-Zahlungsmethode:</span>
                    <input
                      type="text"
                      value={backupPayment}
                      onChange={(e) => setBackupPayment(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-zinc-850 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 text-[11px]"
                    />
                  </div>
                </div>

                {/* Email Preferences toggle */}
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10.5px]">
                  <span className="text-zinc-400">Rechnungs- & Zahlungsemails erhalten</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={paymentsEmailPref}
                      onChange={() => setPaymentsEmailPref(!paymentsEmailPref)}
                    />
                    <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#deff9a] peer-checked:after:bg-black"></div>
                  </label>
                </div>

              </div>

            </div>

            {/* Right Block: Categorized permission selection lists (Col Span 7) */}
            <div className="lg:col-span-7 bg-black/30 p-4 rounded-xl border border-zinc-900 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-3">
                  <h3 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                    Feine Berechtigungs-Matrix (IAM Permissions)
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#deff9a]"></span>
                    <span className="text-[9px] text-[#deff9a] font-mono uppercase tracking-widest">{iamPermissions.length} Aktive Claims</span>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {/* Categorize them */}
                  {Array.from(new Set(ALL_IAM_PERMISSIONS.map(p => p.category))).map(cat => (
                    <div key={cat} className="space-y-1.5">
                      <h4 className="text-[10px] font-mono text-[#deff9a] uppercase border-b border-zinc-900 pb-0.5 font-bold tracking-wide">
                        {cat}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {ALL_IAM_PERMISSIONS.filter(p => p.category === cat).map(p => {
                          const active = iamPermissions.includes(p.id);
                          return (
                            <div 
                              key={p.id}
                              onClick={() => togglePermission(p.id)}
                              className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-all border ${
                                active 
                                  ? 'bg-[#deff9a]/10 border-[#deff9a]/30 text-white' 
                                  : 'bg-transparent border-zinc-900 opacity-60 hover:opacity-100 hover:border-zinc-800'
                              }`}
                            >
                              <input 
                                type="checkbox"
                                checked={active}
                                onChange={() => {}} // handled by div click
                                className="accent-[#deff9a] mt-0.5 pointer-events-none shrink-0"
                              />
                              <div className="text-[11px] leading-tight space-y-0.5">
                                <span className="font-mono font-bold block text-[#deff9a] text-[10px] truncate" title={p.id}>{p.id}</span>
                                <span className="text-[9px] text-zinc-400 block font-sans line-clamp-2">{p.desc}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-System Console Synchronization Assessment Card */}
              <div className="mt-4 pt-3 border-t border-zinc-900">
                <div className="bg-black/80 rounded-xl border border-zinc-850 p-4 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-white font-orbitron flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" /> CONSOLE INTEGRATION VERDICT
                  </h4>
                  
                  {paymentsRole === 'admin' && (iamRole === 'billing.admin' || iamPermissions.includes('billing.accounts.getPaymentInfo')) ? (
                    <div className="space-y-1 text-xs">
                      <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <span>✓</span> FULLY OPERATIONAL (All-in-One Console Enabled)
                      </p>
                      <p className="text-zinc-400 text-[10.5px]">
                        Rene Demir hat sowohl die Abrechnungsverwalter-Rolle in IAM als auch payments-Admin-Rechte. Zahlungsmethoden, Auszüge und SEPA-Volksbank Mandate können <strong>direkt aus der Cloud Console</strong> modifiziert werden. Eine Anmeldung im separaten Google Payments Center ist nicht zwingend erforderlich.
                      </p>
                    </div>
                  ) : paymentsRole === 'viewer' ? (
                    <div className="space-y-1 text-xs">
                      <p className="text-amber-400 font-bold flex items-center gap-1.5">
                        <span>⚠️</span> SYSTEM SPLIT: READ-ONLY CONSOLE ACCESS
                      </p>
                      <p className="text-zinc-400 text-[10.5px]">
                        Aktivitäten, Tarife und Budgets sind in der Cloud Console voll einsehbar, aber Änderungen an Rechnungsadressen oder Kreditkarten führen zu Berechtigungsfehlern. René muss zur Durchführung von Zahlungsmodifikationen direkt das <strong>Google Payments Center</strong> verwenden oder seine payments Center Zuweisung auf <em>Admin with all permissions</em> heraufstufen.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs">
                      <p className="text-rose-400 font-bold flex items-center gap-1.5">
                        <span>❌</span> CONSOLE PAYMENTS DISCONNECTED
                      </p>
                      <p className="text-zinc-500 text-[10.5px]">
                        Kein Zugriff auf finanzielle Bezahldaten möglich, da keine Berechtigung am Google Zahlungsprofil vorliegt. Das Ändern von Revolut-Firmendaten oder die Freigabe wöchentlicher CUD-Einkäufe schlägt direkt fehl. Kontaktieren Sie den Administrator des Google-Zahlungsprofils zur Zuweisung.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Bottom portion: Sync logs and action button */}
          <div className="bg-black/60 p-4 rounded-xl border border-zinc-900 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            
            {/* Terminal sync logs */}
            <div className="flex-1 min-h-[110px] max-h-[180px] bg-black border border-zinc-850 p-3 rounded-lg mono text-[10px] text-emerald-400/95 overflow-y-auto space-y-1">
              {iamLogs.length === 0 ? (
                <span className="text-zinc-600 block italic">// Drücke "IAM Policy & Payments synchronisieren" zum Ausführen der Simulation im Münsterland-Sanctum...</span>
              ) : (
                iamLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-zinc-650">[{index + 1}]</span>
                    <span className="whitespace-pre-line">{log}</span>
                  </div>
                ))
              )}
              {iamSyncState === 'syncing' && (
                <div className="flex items-center gap-2 mt-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#deff9a]" />
                  <span className="text-[#deff9a] font-bold">Synchronisiere... {iamProgress}%</span>
                </div>
              )}
            </div>

            {/* Sync button */}
            <div className="flex flex-col justify-center min-w-[240px]">
              <button
                type="button"
                onClick={runIamSync}
                disabled={iamSyncState === 'syncing'}
                className="bg-[#deff9a] text-black font-orbitron font-bold text-xs uppercase py-3.5 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(222,255,154,0.4)] hover:scale-[1.03] transition-all cursor-pointer flex justify-center items-center gap-2 disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${iamSyncState === 'syncing' ? 'animate-spin' : ''}`} />
                IAM Policy & Payments synchronisieren
              </button>
              <span className="text-[9px] text-zinc-500 font-mono text-center mt-2.5 uppercase tracking-wider block">
                Z1 CORE API STAGE: SECURE-LEDGER
              </span>
            </div>

          </div>
        </div>

        {/* Dynamic Mathematical Stability Formula Widget */}
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sliders className="w-4 h-4 text-[#deff9a]" />
                <span className="text-[10px] font-orbitron font-bold text-[#deff9a] uppercase tracking-widest">Die Mathematik der Reparatur</span>
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-white font-orbitron">SYSTEM-STABILITÄTS SIMULATOR</h3>
              <p className="text-xs text-[#daffde]/70 font-sans">
                Formel: S = 1 - e^(-λ * t). Unser Soll-Ziel ist ein stabiler Wert von 1.0 (100% Systemleistung im Sanctum).
              </p>
            </div>
            
            <div className="bg-black/80 px-4 py-2 rounded-lg border border-zinc-900 flex items-center gap-3">
              <span className="text-xs font-mono opacity-50">Stability Stabilitätswert S:</span>
              <span className="text-2xl font-orbitron font-bold text-[#deff9a]">{(stabilityS * 100).toFixed(2)} %</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 p-4 rounded-xl border border-zinc-900 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase tracking-wider text-white">Repair-Faktor (λ)</span>
                <span className="font-mono text-[#deff9a] text-sm font-bold">{lambda.toFixed(3)}</span>
              </div>
              <input 
                type="range"
                min="0.05"
                max="0.80"
                step="0.01"
                value={lambda}
                onChange={(e) => setLambda(parseFloat(e.target.value))}
                className="w-full accent-[#deff9a] h-1.5"
              />
              <p className="text-[10px] opacity-50 font-mono">
                Repräsentiert die Interventionsgeschwindigkeit von Operia & Algorya zur Selbstreinigung.
              </p>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-zinc-900 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase tracking-wider text-white">Feldzeit (t)</span>
                <span className="font-mono text-[#deff9a] text-sm font-bold">{timeValue.toFixed(1)}</span>
              </div>
              <input 
                type="range"
                min="1.0"
                max="24.0"
                step="0.5"
                value={timeValue}
                onChange={(e) => setTimeValue(parseFloat(e.target.value))}
                className="w-full accent-[#deff9a] h-1.5"
              />
              <p className="text-[10px] opacity-50 font-mono">
                Systemlaufzeit seit dem letzten Audit im Münsterland-Sanctum.
              </p>
            </div>
          </div>
        </div>

        {/* 33 Goddesses Section Header / Control terminal */}
        <section id="goddesses-management" className="space-y-6 pt-4">
          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-[#deff9a]" />
                <h2 className="text-2xl font-bold uppercase tracking-widest text-[#deff9a] font-orbitron">
                  Pantheon Control Arena
                </h2>
              </div>
              <p className="text-xs opacity-70 serif-italic">
                Umfassende Diagnose des Pantheon API-Gateway Netzwerks. Monitor aller 33 Göttinnen-Knoten.
              </p>
            </div>

            {/* Access Filtering & Search */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                <input 
                  type="text" 
                  placeholder="Göttin suchen..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-sm text-white rounded-xl py-2.5 pl-9 pr-4 w-full focus:outline-none focus:border-[#deff9a] transition-all mono placeholder:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Access tabs filter */}
          <div className="flex flex-wrap gap-1.5 py-1.5 border-b border-zinc-900">
            {uniqueAccessTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedAccessTab(tag)}
                className={`text-[9px] font-mono tracking-widest uppercase px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                  selectedAccessTab === tag ? 'bg-[#deff9a] text-black border-[#deff9a] font-bold' : 'bg-transparent text-[#daffde]/60 border-zinc-900 hover:text-white hover:border-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Goddard grid view */}
          {loading ? (
            <div className="flex justify-center p-20">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <Zap className="w-8 h-8 opacity-20" />
                <span className="text-xs mono opacity-50">SYNCHRONIZING PANTHEON GATEWAY...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-0 gap-x-0 border-l border-t border-zinc-800">
              {filteredGoddesses.map((goddess, index) => (
                <motion.div 
                  key={goddess.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01 }}
                  className="border-r border-b border-zinc-850 p-4 bg-zinc-950/20 group hover:bg-zinc-900/60 hover:text-white transition-all duration-350 relative overflow-hidden flex flex-col justify-between"
                  style={{ minHeight: '220px' }}
                >
                  <div>
                    {/* Top alignment row */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">ID: {goddess.id}</span>
                          {goddess.escalation && (
                            <span className="bg-rose-500/10 text-rose-400 text-[8px] px-1 border border-rose-500/20 font-bold uppercase mono animate-pulse">Escalation+</span>
                          )}
                          {goddess.id === 'operia' && (
                            <span className="bg-[#deff9a]/10 text-[#deff9a] text-[8px] px-1.5 py-0.5 rounded border border-[#deff9a]/20 font-bold uppercase font-orbitron">Adjutantin</span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-tight text-white font-orbitron">{goddess.name}</h3>
                      </div>
                      <div className={`flex items-center gap-1.5 font-mono text-[9px] uppercase ${getStatusColor(goddess.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${goddess.status === 'online' ? 'bg-emerald-400 animate-pulse' : goddess.status === 'prepped' ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
                        {goddess.status}
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-[10px] font-mono">
                      <div>
                        <span className="opacity-40 text-[8px] uppercase tracking-wider block">Domain</span>
                        <span className="text-[#deff9a] text-[10px] font-bold uppercase">{goddess.domain}</span>
                      </div>
                      <div>
                        <span className="opacity-40 text-[8px] uppercase tracking-wider block">Core Strength</span>
                        <span className="text-white text-[10px] font-bold uppercase">{goddess.core_strength}</span>
                      </div>
                    </div>

                    {/* Mission role description */}
                    <div className="mb-3">
                      <div className="bg-black/40 group-hover:bg-zinc-950/95 border border-zinc-900 p-2 text-[10px] leading-tight text-[#daffde]/90">
                        <p className="serif-italic opacity-80 mb-1">"{goddess.prompt_prefix}"</p>
                        <p className="font-sans font-medium text-zinc-400 text-[10px]"><strong>Role:</strong> {goddess.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Access tags of goddess */}
                  <div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {goddess.access.map(acc => (
                        <span key={acc} className="text-[8px] font-mono uppercase bg-zinc-900 text-zinc-400 px-1.5 py-0.5 border border-zinc-800">
                          {acc}
                        </span>
                      ))}
                    </div>

                    {/* Endpoint URL */}
                    <div className="pt-2 border-t border-zinc-900/40 text-[8px] font-mono text-zinc-600 truncate group-hover:text-zinc-500">
                      Endpoint: {goddess.url}
                    </div>
                  </div>

                  {/* Visual Status bar overlay */}
                  <div className={`absolute bottom-0 left-0 w-full h-0.5 ${goddess.status === 'online' ? 'bg-emerald-400' : goddess.status === 'prepped' ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Zero results placeholder */}
          {!loading && filteredGoddesses.length === 0 && (
            <div className="border border-dashed border-zinc-800 p-12 text-center rounded-xl">
              <HelpCircle className="w-8 h-8 mx-auto opacity-35 mb-2 text-[#deff9a]" />
              <p className="text-sm font-mono opacity-50 uppercase">Keine Agentin stimmt mit Suchbegriffen oder Filtern überein.</p>
            </div>
          )}
        </section>

        {/* Footer info & system metadata */}
        <footer className="mt-16 pt-8 border-t border-zinc-800 flex flex-wrap gap-y-4 gap-x-8 text-[11px] font-mono opacity-50 justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#deff9a]" />
            <span>CORE REGION: MUNSTERLAND / HEIDEN (Z1 SYSTEMS)</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>SQL SANCTUM CORE VERIFIED: LÖWENHERZ-Z1</span>
          </div>
          <div>
            <span>SYSTEM ENCRYPTED FOR RENE DEMIR GEBORENER ENSTONE VON LÖWENHERZ</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
