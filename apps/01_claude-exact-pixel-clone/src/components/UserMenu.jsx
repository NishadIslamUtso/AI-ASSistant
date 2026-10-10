import React from 'react'
import { C, M } from '../theme.js'
import { Icon, P } from './Icons.jsx'

/** User menu — 191608.png. 239 px wide, opens above the NU avatar. */
export default function UserMenu({ onClose, onSettings, onApps, onLogout, email = 'nishadislamutso@gmail.com' }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-[10px] py-[2px] shadow-2xl"
        style={{
          left: 7, bottom: 35, width: M.userMenu.w,
          background: '#20201f', border: '1px solid #373736',
        }}
      >
        <div className="px-[11px] py-[2px] text-[12px] truncate" style={{ color: C.text3 }} title={email}>
          {email}
        </div>
        {/* measured from 191608: no divider under the e-mail row */}
        <Group items={[
          { icon: P.gear, label: 'Settings', onClick: onSettings },
          { icon: P.globe, label: 'Language', chevron: true },
          { icon: P.help, label: 'Get help' },
        ]} />
        <Sep />
        <Group items={[
          { icon: P.star, label: 'Upgrade plan' },
          { icon: P.grid, label: 'Get apps and extensions', onClick: onApps },
          { icon: P.info, label: 'Learn more' },
        ]} />
        <Sep />
        <Group items={[{ icon: P.key, label: 'Get API keys' }]} />
        <Sep />
        <Group items={[{ icon: P.logout, label: 'Log out', onClick: onLogout }]} />
      </div>
    </>
  )
}

const Sep = () => <div className="my-[4px]" style={{ height: 1, background: '#373736' }} />

function Group({ items }) {
  return (
    <div>
      {items.map((it) => (
        <button
          key={it.label}
          onClick={it.onClick}
          className="flex items-center w-full rounded-[6px] hover:bg-[#383837]"
          style={{ height: 22, paddingLeft: 10, paddingRight: 10, color: C.text }}
        >
          <Icon d={it.icon} size={14} />
          <span className="ml-[8px] text-[13px] flex-1 text-left">{it.label}</span>
          {it.chevron && <Icon d={P.chevron} size={11} className="opacity-60" />}
        </button>
      ))}
    </div>
  )
}
