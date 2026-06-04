'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HelpOutlineIcon from '@mui/icons-material/InfoOutlined';
import KeyIcon from '@mui/icons-material/Key';
import SpeedIcon from '@mui/icons-material/Speed';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// ─── Status helpers ──────────────────────────────────────────────────────────

function getStatusChip(status) {
  const configs = {
    ok: { label: 'ปกติ', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
    quota_exceeded: { label: 'Quota หมด (429)', color: 'error', icon: <ErrorIcon sx={{ fontSize: 16 }} /> },
    invalid_key: { label: 'API Key ผิด', color: 'error', icon: <ErrorIcon sx={{ fontSize: 16 }} /> },
    error: { label: 'ผิดพลาด', color: 'error', icon: <ErrorIcon sx={{ fontSize: 16 }} /> },
    not_configured: { label: 'ยังไม่ตั้งค่า', color: 'warning', icon: <WarningIcon sx={{ fontSize: 16 }} /> },
    loading: { label: 'กำลังตรวจสอบ...', color: 'default', icon: <CircularProgress size={12} /> },
  };
  const cfg = configs[status] || configs.loading;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      color={cfg.color}
      size="small"
      sx={{ fontWeight: 700, fontSize: '0.82rem', px: 0.5 }}
    />
  );
}

function StatusCard({ title, icon, children, accent }) {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: (theme) =>
          `1px solid ${theme.palette.mode === 'dark' ? '#1E293B' : '#E2E8F0'}`,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': accent
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: accent,
            }
          : {},
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: '10px',
              background: accent || 'linear-gradient(135deg, #4F46E5, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, sub, mono }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1,
        borderBottom: (theme) =>
          `1px solid ${theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9'}`,
        '&:last-child': { borderBottom: 'none' },
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: 'right', minWidth: 0, flexGrow: 1 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ 
            fontFamily: mono ? 'monospace' : 'inherit',
            wordBreak: 'break-all',
          }}
        >
          {value ?? '-'}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Latency Gauge ──────────────────────────────────────────────────────────

function LatencyGauge({ ms }) {
  if (ms == null) return <Typography variant="body2" color="text.secondary">ยังไม่ทดสอบ</Typography>;
  const color = ms < 800 ? '#10B981' : ms < 2000 ? '#F59E0B' : '#EF4444';
  const label = ms < 800 ? 'เร็ว' : ms < 2000 ? 'ปานกลาง' : 'ช้า';
  const pct = Math.min(100, (ms / 5000) * 100);
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color }}>
          {ms}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            ms
          </Typography>
        </Typography>
        <Chip label={label} size="small" sx={{ bgcolor: color, color: '#fff', fontWeight: 700 }} />
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'action.selected',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

// ─── Main Admin View ─────────────────────────────────────────────────────────

export default function AdminView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStatus = useCallback(async (withPing = false) => {
    if (withPing) setPinging(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/admin/status${withPing ? '?ping=true' : ''}`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setPinging(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => fetchStatus(false), 30000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchStatus]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={48} thickness={4} />
        <Typography color="text.secondary">กำลังโหลดข้อมูล...</Typography>
      </Box>
    );
  }

  if (forbidden) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 3, textAlign: 'center', px: 2 }}>
        <Box sx={{ p: 3, borderRadius: '50%', bgcolor: 'error.light', display: 'inline-flex' }}>
          <LockIcon sx={{ fontSize: 48, color: 'error.main' }} />
        </Box>
        <Typography variant="h5" fontWeight={700}>ไม่มีสิทธิ์เข้าถึง</Typography>
        <Typography color="text.secondary">
          หน้านี้สำหรับผู้ดูแลระบบเท่านั้น<br />
          กรุณาตั้งค่า <code>ADMIN_EMAIL</code> ใน <code>.env</code> และเข้าสู่ระบบด้วยอีเมลดังกล่าว
        </Typography>
      </Box>
    );
  }

  if (!data) return null;

  const pingStatus = data.ping?.status || (pinging ? 'loading' : null);
  const keyOk = data.keyConfigured;

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        justifyContent: 'space-between', 
        mb: 4, 
        flexDirection: { xs: 'column', sm: 'row' }, 
        gap: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'inline-flex' }}>
            <AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              แผงผู้ดูแลระบบ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ตรวจสอบสถานะ DeepSeek API และการใช้งานระบบ
            </Typography>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          width: { xs: '100%', sm: 'auto' }, 
          justifyContent: { xs: 'space-between', sm: 'flex-end' },
          borderTop: { xs: '1px solid', sm: 'none' },
          borderColor: 'divider',
          pt: { xs: 1.5, sm: 0 }
        }}>
          {lastRefresh && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14 }} />
              อัปเดต: {lastRefresh.toLocaleTimeString('th-TH')}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={autoRefresh ? 'ปิดรีเฟรชอัตโนมัติ' : 'เปิดรีเฟรชอัตโนมัติ (ทุก 30 วิ)'}>
              <Chip
                label={autoRefresh ? 'Auto ON' : 'Auto OFF'}
                size="small"
                color={autoRefresh ? 'success' : 'default'}
                onClick={() => setAutoRefresh((v) => !v)}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            </Tooltip>
            <IconButton
              onClick={() => fetchStatus(false)}
              disabled={loading || pinging}
              sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}
            >
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* ── Key not configured warning ── */}
      {!keyOk && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          <strong>DEEPSEEK_API_KEY ยังไม่ได้ตั้งค่า!</strong> กรุณาเพิ่มใน <code>.env</code> แล้ว restart เซิร์ฟเวอร์
        </Alert>
      )}

      <Grid container spacing={3}>

        {/* ── API Key Card ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <StatusCard
            title="API Key"
            icon={<KeyIcon sx={{ fontSize: 20 }} />}
            accent="linear-gradient(90deg, #4F46E5, #7C3AED)"
          >
            <MetricRow
              label="สถานะ"
              value={keyOk ? '✅ ตั้งค่าแล้ว' : '❌ ยังไม่ตั้งค่า'}
            />
            <MetricRow
              label="Key (masked)"
              value={data.maskedKey || 'N/A'}
              mono
            />
            <MetricRow label="โมเดล" value={data.model} />
            <MetricRow
              label="เวลาเซิร์ฟเวอร์"
              value={new Date(data.serverTime).toLocaleString('th-TH')}
            />
          </StatusCard>
        </Grid>

        {/* ── Live Ping Card ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <StatusCard
            title="ทดสอบการเชื่อมต่อ (Live Ping)"
            icon={<NetworkCheckIcon sx={{ fontSize: 20 }} />}
            accent="linear-gradient(90deg, #06B6D4, #0EA5E9)"
          >
            {data.ping ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      สถานะ API:
                    </Typography>
                    {getStatusChip(pingStatus)}
                  </Box>
                  {data.ping.message && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {data.ping.message}
                    </Typography>
                  )}
                  {data.ping.error && (
                    <Alert severity="error" sx={{ py: 0.5, borderRadius: '8px', mb: 1.5 }}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {data.ping.error}
                      </Typography>
                    </Alert>
                  )}
                  <LatencyGauge ms={data.ping.latencyMs} />
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  กด "ทดสอบ" เพื่อ ping DeepSeek API แบบ real-time
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              fullWidth
              startIcon={pinging ? <CircularProgress size={16} color="inherit" /> : <NetworkCheckIcon />}
              onClick={() => fetchStatus(true)}
              disabled={pinging || !keyOk}
              sx={{
                mt: 1,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',
                fontWeight: 700,
                '&:hover': { background: 'linear-gradient(135deg, #0891B2, #0284C7)' },
              }}
            >
              {pinging ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
            </Button>
          </StatusCard>
        </Grid>

        {/* ── Session Usage Stats ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <StatusCard
            title="สถิติการใช้งาน (Session)"
            icon={<SmartToyIcon sx={{ fontSize: 20 }} />}
            accent="linear-gradient(90deg, #10B981, #34D399)"
          >
            <MetricRow label="คำขอทั้งหมด" value={data.usage?.totalRequests ?? 0} />
            <MetricRow label="สำเร็จ" value={data.usage?.successCount ?? 0} />
            <MetricRow label="ล้มเหลว" value={data.usage?.errorCount ?? 0} />
            <MetricRow
              label="Quota Error (429)"
              value={data.usage?.quotaErrors ?? 0}
            />
            {data.usage?.quotaErrors > 0 && (
              <Alert severity="warning" sx={{ mt: 1.5, borderRadius: '8px', py: 0.5 }}>
                พบ Rate Limit {data.usage.quotaErrors} ครั้งในเซสชันนี้
              </Alert>
            )}
          </StatusCard>
        </Grid>

        {/* ── Quota Info ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <StatusCard
            title="ข้อมูล Quota & Limit"
            icon={<SpeedIcon sx={{ fontSize: 20 }} />}
            accent="linear-gradient(90deg, #F59E0B, #FBBF24)"
          >
            <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
              ระบบใช้ <strong>DeepSeek V3 / Chat</strong> ผ่าน DeepSeek Platform
            </Alert>
            <MetricRow label="ความเร็วสูงสุด" value="ขึ้นอยู่กับ API Tier" sub="DeepSeek Platform" />
            <MetricRow label="โมเดลหลัก" value="deepseek-chat" sub="DeepSeek V3 Model" />
            <MetricRow label="ประเภทคีย์" value="Pay-as-you-go" sub="Developer API" />
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                หากเกิน Quota จะเห็น error 429 ในหน้านี้ ✦ ตรวจสอบแดชบอร์ดและเติมเงินได้ที่{' '}
                <a
                  href="https://platform.deepseek.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#4F46E5' }}
                >
                  DeepSeek Platform
                </a>
              </Typography>
            </Box>
          </StatusCard>
        </Grid>

        {/* ── Last Error ── */}
        {(data.usage?.lastError || data.usage?.lastErrorTime) && (
          <Grid size={{ xs: 12 }}>
            <StatusCard
              title="ข้อผิดพลาดล่าสุด"
              icon={<ErrorIcon sx={{ fontSize: 20 }} />}
              accent="linear-gradient(90deg, #EF4444, #F87171)"
            >
              <MetricRow
                label="เวลาที่เกิด"
                value={
                  data.usage.lastErrorTime
                    ? new Date(data.usage.lastErrorTime).toLocaleString('th-TH')
                    : '-'
                }
              />
              {data.usage.lastError && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: 'error.light',
                    color: 'error.dark',
                  }}
                >
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {data.usage.lastError}
                  </Typography>
                </Box>
              )}
            </StatusCard>
          </Grid>
        )}

        {/* ── Instructions ── */}
        <Grid size={{ xs: 12 }}>
          <Card
            sx={{
              borderRadius: '16px',
              border: (theme) =>
                `1px solid ${theme.palette.mode === 'dark' ? '#1E293B' : '#E2E8F0'}`,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(79, 70, 229, 0.05)'
                  : 'rgba(79, 70, 229, 0.03)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HelpOutlineIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>
                  วิธีตั้งค่าระบบผู้ดูแลและคีย์ API
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, opacity: 0.3 }} />
              <Typography variant="body2" color="text.secondary" component="div">
                <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 2.2 }}>
                  <li>เปิดไฟล์ <code>.env</code> ในรูตโปรเจกต์</li>
                  <li>
                    ตั้งค่าอีเมลผู้ดูแล:{' '}
                    <code style={{ background: '#4F46E510', padding: '2px 6px', borderRadius: 4 }}>
                      ADMIN_EMAIL=your-email@example.com
                    </code>
                  </li>
                  <li>
                    ตั้งค่าคีย์ DeepSeek:{' '}
                    <code style={{ background: '#4F46E510', padding: '2px 6px', borderRadius: 4 }}>
                      DEEPSEEK_API_KEY=sk-xxxx...
                    </code>
                  </li>
                  <li>Restart dev server หรือ redeploy บน Vercel</li>
                  <li>เข้าสู่ระบบด้วยอีเมลผู้ดูแลเพื่อจัดการระบบ</li>
                </ol>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
