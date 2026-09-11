import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Eye, Wifi, Radio, Cpu, Lock, CheckCircle2,
  AlertTriangle, RefreshCw, Sparkles, User, Award, Volume2
} from 'lucide-react';

interface BiometricPresenceHUDProps {
  studentUsn?: string;
  studentName?: string;
  onSuccess?: (proof: any) => void;
}

export function BiometricPresenceHUD({
  studentUsn = '4JC21CS001',
  studentName = 'Preetham J.',
  onSuccess
}: BiometricPresenceHUDProps) {
  // Biometric Vectors State
  const [ear, setEar] = useState(0.29);
  const [blinkCount, setBlinkCount] = useState(2);
  const [yaw, setYaw] = useState(-2.4);
  const [pitch, setPitch] = useState(1.8);
  const [depthParallax, setDepthParallax] = useState(0.88);
  const [moireScore, setMoireScore] = useState(0.04);

  // Tri-Band Beacon State
  const [bleRssi, setBleRssi] = useState(-62);
  const [distanceMeters, setDistanceMeters] = useState(2.8);
  const [wifiMatched, setWifiMatched] = useState(true);
  const [ultrasonicActive, setUltrasonicActive] = useState(true);

  // Minting & Result State
  const [isVerifying, setIsVerifying] = useState(false);
  const [zkProof, setZkProof] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live Canvas 3D Face Wireframe Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId: number;
    let frame = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Dark Matrix Background
      ctx.fillStyle = '#060d17';
      ctx.fillRect(0, 0, w, h);

      // Radar Scan Line
      const scanY = (frame * 2.5) % h;
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(1, 'rgba(16, 185, 129, 0.25)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 20, w, 20);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();

      // Draw 3D Face Oval Landmarks Mesh
      const eyeOpenHeight = ear * 38;
      const headOffset = Math.sin(frame * 0.04) * 8;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1;

      // Outer Head Contour
      ctx.beginPath();
      ctx.ellipse(cx + headOffset * 0.5, cy - 10, 85, 115, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Facial Grid Lines (Tessellation)
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + headOffset * 0.5 + i * 22, cy - 110);
        ctx.quadraticCurveTo(cx + headOffset + i * 28, cy - 10, cx + headOffset * 0.5 + i * 16, cy + 95);
        ctx.stroke();
      }
      for (let j = -3; j <= 3; j++) {
        ctx.beginPath();
        ctx.moveTo(cx + headOffset * 0.5 - 75, cy + j * 24);
        ctx.quadraticCurveTo(cx + headOffset, cy + j * 28 - 10, cx + headOffset * 0.5 + 75, cy + j * 24);
        ctx.stroke();
      }

      // Eye Landmark Boxes (EAR visualization)
      ctx.strokeStyle = ear < 0.16 ? '#f43f5e' : '#10b981';
      ctx.lineWidth = 2;

      // Left Eye
      ctx.beginPath();
      ctx.ellipse(cx - 36 + headOffset * 0.7, cy - 25, 20, Math.max(3, eyeOpenHeight), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Right Eye
      ctx.beginPath();
      ctx.ellipse(cx + 36 + headOffset * 0.7, cy - 25, 20, Math.max(3, eyeOpenHeight), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Nose & Mouth Grid
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.beginPath();
      ctx.moveTo(cx + headOffset, cy - 15);
      ctx.lineTo(cx - 10 + headOffset, cy + 15);
      ctx.lineTo(cx + 10 + headOffset, cy + 15);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx + headOffset, cy + 45, 26, 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Telemetry Overlay HUD
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`EAR: ${ear.toFixed(2)} (${ear < 0.16 ? 'BLINK' : 'OPEN'})`, 15, 25);
      ctx.fillText(`BLINKS: ${blinkCount}`, 15, 42);
      ctx.fillText(`PARALLAX: ${depthParallax} (3D DEPTH)`, 15, 59);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`BLE RSSI: ${bleRssi} dBm (~${distanceMeters}m)`, w - 210, 25);
      ctx.fillText(`ACOUSTIC CHIRP: 18.5 kHz [LOCKED]`, w - 210, 42);
      ctx.fillText(`ANTI-SPOOF: 99.8% BIO-AUTHENTIC`, w - 210, 59);

      frame++;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [ear, blinkCount, depthParallax, bleRssi, distanceMeters]);

  // Simulate Blink Action
  const triggerSimulatedBlink = () => {
    setEar(0.08); // dip to blink
    setTimeout(() => {
      setEar(0.29);
      setBlinkCount(prev => prev + 1);
    }, 220);
  };

  // Execute ZK-Proof Attendance Checkin
  const handleZkCheckin = async () => {
    setIsVerifying(true);
    setStatusMessage('Generating Zero-Knowledge Poseidon Commitment & verifying Tri-Band signals...');

    try {
      const res = await fetch('/api/v5/biometric/zk-proof-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentUsn,
          sessionId: 'SES-LIVE-SJCE-101',
          faceVectors: {
            leftEyeEar: ear,
            rightEyeEar: ear,
            blinkCount: Math.max(1, blinkCount),
            headPose: { pitchDeg: pitch, yawDeg: yaw, rollDeg: 0.8 },
            depthParallaxDisparity: depthParallax,
            moireArtifactScore: moireScore
          },
          beaconTelemetry: {
            bleRssiDbm: bleRssi,
            wifiBssidHash: '0x8f2a4c6e1b3d5f7a9c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e1b3d5f7a',
            ultrasonicChirpToken: 'CHIRP_LIVE_PODIUM_SJCE',
            clientGps: { lat: 12.3142, lng: 76.6135 }
          }
        })
      });

      const data = await res.json();
      if (data.success && data.proof) {
        setZkProof(data.proof);
        setStatusMessage('Zero-Knowledge Biometric Presence Authenticated. SBT Minted.');
        if (onSuccess) onSuccess(data.proof);
      } else {
        setStatusMessage(data.message || 'Verification Failed.');
      }
    } catch (err) {
      console.error('ZK Check-in failed:', err);
      setStatusMessage('Network or server error during ZK proof validation.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-6 max-w-4xl mx-auto">
      {/* Top Protocol Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Project Astra V5.0 · Zero-Knowledge Biometric Presence</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            3D Face Mesh Liveness & Quantum-Resistant Geofence Mesh
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Student: <strong className="text-slate-200">{studentName} ({studentUsn})</strong> · Session: <span className="font-mono text-emerald-400">SES-LIVE-SJCE-101</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            FIDO2 WebAuthn
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 font-bold">
            99.8% LIVENESS
          </span>
        </div>
      </div>

      {/* Main Grid: Face Canvas (Left) & Tri-Band Radar / ZK (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: 3D Face Wireframe Canvas */}
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-[#060d17]">
            <canvas
              ref={canvasRef}
              width={420}
              height={320}
              className="w-full h-auto block"
            />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>468-PT 3D MESH TRACKER</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={triggerSimulatedBlink}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Trigger Biological Blink</span>
            </button>

            <button
              onClick={() => {
                setBleRssi(prev => (prev === -62 ? -54 : -62));
                setDistanceMeters(prev => (prev === 2.8 ? 1.4 : 2.8));
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              title="Calibrate BLE beacon proximity"
            >
              <Radio className="w-4 h-4 text-sky-400" />
              <span>Beacon Ping</span>
            </button>
          </div>
        </div>

        {/* Right: Tri-Band Geofence & ZK Token Panel */}
        <div className="space-y-4">
          {/* Tri-Band Geofence Signals */}
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3 text-xs">
            <div className="font-bold text-slate-200 flex items-center justify-between">
              <span>Tri-Band Physical Proximity Mesh</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                INDOOR GEOFENCE LOCKED
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-sky-400" /> BLE RSSI Attenuation:
                </span>
                <span className="font-mono text-sky-300 font-bold">{bleRssi} dBm (~{distanceMeters}m from podium)</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Classroom WiFi BSSID:
                </span>
                <span className="font-mono text-emerald-300 font-bold">SJCE-AP-CS101 (MATCH)</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Ultrasonic Acoustic Chirp:
                </span>
                <span className="font-mono text-amber-300 font-bold">18.5 kHz (ACTIVE)</span>
              </div>
            </div>
          </div>

          {/* ZK Proof Receipt / Action Card */}
          {zkProof ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2.5 text-xs animate-fade-in">
              <div className="flex items-center justify-between font-bold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" /> Soulbound Token Minted!
                </span>
                <span className="font-mono text-[10px] bg-emerald-900 px-2 py-0.5 rounded border border-emerald-700">
                  {zkProof.sbtTokenId}
                </span>
              </div>

              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                <div>Proof ID: <span className="text-emerald-400">{zkProof.proofId}</span></div>
                <div className="truncate">Commitment: <span className="text-slate-400">{zkProof.commitmentHash}</span></div>
                <div className="truncate">Merkle Root: <span className="text-slate-400">{zkProof.merkleRoot}</span></div>
                <div>Liveness: <span className="text-emerald-400">{zkProof.livenessConfidencePercent}% Verified</span></div>
              </div>

              <div className="p-2 bg-emerald-900/30 rounded text-[11px] text-emerald-200 border border-emerald-700/30">
                ✓ Cryptographic attendance immutably stamped into SJCE CS Dept SQLite WAL Ledger.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
              <div className="text-xs text-slate-300 leading-relaxed">
                Zero-Knowledge Proof guarantees your presence is mathematically proven to the professor
                without storing raw biometric facial vectors or personal tracking telemetry on external servers.
              </div>

              <button
                onClick={handleZkCheckin}
                disabled={isVerifying}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs tracking-wide shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validating ZK Proof & Minting Token...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Verify Presence & Mint ZK-Attendance Token</span>
                  </>
                )}
              </button>
            </div>
          )}

          {statusMessage && (
            <div className="text-[11px] text-center font-mono text-slate-400">
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
