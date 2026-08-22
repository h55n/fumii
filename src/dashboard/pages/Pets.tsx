import React, { useEffect, useState } from 'react';
import { usePetStore, type CodexPet } from '../../store/petStore';
import { useAppStore } from '../../store/appStore';
import { AnimatedFumiiCompanion, CodexSpritePlayer } from '../../pet/PetWidget';
import type { FumiiState, BehaviorMode } from '../../sprite/EmotionState';

const SORTS = [
  { id: 'new', label: 'Newest' },
  { id: 'popular', label: 'Liked' },
  { id: 'views', label: 'Viewed' },
  { id: 'discussed', label: 'Discussed' },
  { id: 'random', label: 'Random' }
] as const;

const EMOTIONS: { id: FumiiState; label: string; icon: string }[] = [
  { id: 'idle', label: 'Idle Rest', icon: '✦' },
  { id: 'waving', label: 'Wave & Greet', icon: '👋' },
  { id: 'walk-left', label: 'Walk Left', icon: '🚶' },
  { id: 'walk-right', label: 'Walk Right', icon: '🏃' },
  { id: 'jumping', label: 'Jump & Cheer', icon: '🎉' },
  { id: 'thinking', label: 'Think & Review', icon: '🔍' },
  { id: 'listening', label: 'Listen Attentive', icon: '👂' },
  { id: 'running', label: 'Fast Sprint', icon: '⚡' },
  { id: 'confused', label: 'Puzzled / Error', icon: '💭' },
  { id: 'sleepy', label: 'Snooze / Doze', icon: '💤' }
];

export function Pets() {
  const {
    pets,
    activePet,
    load,
    setActive,
    removePet,
    libraryPets,
    libraryTotal,
    libraryPage,
    libraryTotalPages,
    libraryLoading,
    librarySort,
    fetchLibrary,
    downloadPet,
    installCustomPet
  } = usePetStore();

  const { spriteState, setSpriteState, behaviorMode, setBehaviorMode } = useAppStore();

  const [searchInput, setSearchInput] = useState('');
  const [npxInput, setNpxInput] = useState('');
  const [pageInput, setPageInput] = useState('1');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    load();
    fetchLibrary({ page: 1, pageSize: 30, sort: 'new' });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLibrary({ page: 1, q: searchInput });
  };

  const handleSortChange = (sort: string) => {
    fetchLibrary({ page: 1, sort });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > libraryTotalPages) return;
    setPageInput(String(newPage));
    fetchLibrary({ page: newPage });
  };

  const handleGoPage = () => {
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= libraryTotalPages) {
      fetchLibrary({ page: p });
    }
  };

  const handleDownload = async (pet: CodexPet) => {
    setInstallingId(pet.id);
    await downloadPet(pet);
    setInstallingId(null);
  };

  const handleNpxImport = async () => {
    if (!npxInput.trim()) return;
    setInstallingId('custom-import');
    await installCustomPet(npxInput.trim());
    setNpxInput('');
    setInstallingId(null);
  };

  const copyNpxCommand = (slug: string) => {
    navigator.clipboard.writeText(`npx fumii add ${slug}`);
    setCopiedId(slug);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const installedSlugs = new Set(pets.map((p) => p.slug));

  return (
    <div className="page" style={{ maxWidth: 1040 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">codex-pets library</h1>
        <p className="page-subtitle">
          browse, download, or import directly from the official{' '}
          <a
            href="https://codex-pets.net"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--color-blue)', textDecoration: 'none', fontWeight: 600 }}
          >
            codex-pets.net
          </a>{' '}
          community gallery ({libraryTotal.toLocaleString()} pets)
        </p>
      </div>

      {/* Direct NPX / URL Import Box */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderRadius: 20,
          marginBottom: 20,
          background: 'var(--color-surface)',
          border: '1px solid rgba(37, 99, 235, 0.15)'
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-blue)', marginBottom: 6 }}>
          ⚡ IMPORT BY NPX COMMAND OR URL
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            id="npx-import-input"
            className="input"
            value={npxInput}
            onChange={(e) => setNpxInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNpxImport()}
            placeholder="e.g. npx fumii add shiroha OR https://codex-pets.net/pet/vandaimns OR slug"
            style={{ flex: 1, fontSize: 13 }}
          />
          <button
            id="npx-import-btn"
            className="btn-primary"
            onClick={handleNpxImport}
            disabled={!npxInput.trim() || installingId !== null}
            style={{ padding: '8px 18px', fontSize: 13 }}
          >
            {installingId === 'custom-import' ? 'Downloading...' : 'Import Pet'}
          </button>
        </div>
      </div>

      {/* Companion Feelings & Behavior Studio */}
      <div
        className="card"
        style={{
          padding: '20px 22px',
          borderRadius: 22,
          marginBottom: 24,
          background: 'var(--color-surface)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div className="label" style={{ color: 'var(--color-blue)', margin: 0 }}>
              COMPANION FEELINGS & BEHAVIOR STUDIO
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Trigger live emotions and set how your companion moves across the screen
            </div>
          </div>

          {/* Behavior Mode Selector */}
          <div style={{ display: 'flex', gap: 6, background: 'var(--color-bg)', padding: '4px 6px', borderRadius: 9999, border: '1px solid rgba(0,0,0,0.06)' }}>
            {(
              [
                { id: 'wander', label: '🐾 Autonomous Wanderer' },
                { id: 'attentive', label: '🎯 Attentive Desk Buddy' },
                { id: 'calm', label: '☕ Calm Rest' }
              ] as const
            ).map((bm) => {
              const isModeActive = behaviorMode === bm.id;
              return (
                <button
                  key={bm.id}
                  onClick={() => setBehaviorMode(bm.id as BehaviorMode)}
                  style={{
                    background: isModeActive ? 'var(--color-blue)' : 'transparent',
                    color: isModeActive ? '#ffffff' : 'var(--color-text-secondary)',
                    border: 'none',
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 11,
                    fontWeight: isModeActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  {bm.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Emotion Trigger Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EMOTIONS.map((em) => {
            const isEmActive = spriteState === em.id;
            return (
              <button
                key={em.id}
                onClick={() => setSpriteState(em.id)}
                style={{
                  background: isEmActive ? 'var(--color-blue-soft)' : 'var(--color-bg)',
                  color: isEmActive ? 'var(--color-blue)' : 'var(--color-text-primary)',
                  border: `1px solid ${isEmActive ? 'var(--color-blue)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 9999,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: isEmActive ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 140ms ease'
                }}
              >
                <span>{em.icon}</span>
                <span>{em.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Installed Pets Quick Strip */}
      {pets.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="label" style={{ marginBottom: 10 }}>
            INSTALLED ON YOUR DESKTOP ({pets.length})
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12
            }}
          >
            {pets.map((p) => {
              const isActive = activePet?.slug === p.slug;
              return (
                <div
                  key={p.slug}
                  id={`installed-pet-${p.slug}`}
                  className="card"
                  style={{
                    margin: 0,
                    padding: '12px 14px',
                    textAlign: 'center',
                    border: `2px solid ${isActive ? 'var(--color-blue)' : 'rgba(0,0,0,0.05)'}`,
                    background: isActive ? 'var(--color-surface-active)' : 'var(--color-surface)',
                    borderRadius: 18
                  }}
                >
                  <div
                    style={{
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '4px auto 8px'
                    }}
                  >
                    {p.slug !== 'fumii-default' && p.spritesheetPath ? (
                      <CodexSpritePlayer src={p.spritesheetPath} state="idle" width={60} height={60} />
                    ) : (
                      <div style={{ transform: 'scale(0.55)', transformOrigin: 'center center' }}>
                        <AnimatedFumiiCompanion state="idle" pet={p} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    {p.slug}
                  </div>

                  {isActive ? (
                    <div
                      style={{
                        background: 'var(--color-blue)',
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: 9999
                      }}
                    >
                      ✓ Active Now
                    </div>
                  ) : (
                    <button
                      className="btn-pill"
                      style={{ width: '100%', justifyContent: 'center', fontSize: 11, padding: '4px 8px' }}
                      onClick={() => setActive(p.slug)}
                    >
                      Select Pet
                    </button>
                  )}

                  {!p.isDefault && (
                    <button
                      onClick={() => removePet(p.slug)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-3)',
                        fontSize: 10,
                        cursor: 'pointer',
                        marginTop: 6
                      }}
                    >
                      uninstall
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Codex-Pets Registry Section */}
      <div className="card" style={{ padding: '24px 24px', borderRadius: 24, marginBottom: 28 }}>
        {/* Top Pagination & Stats Bar (Exact Match of Screenshot) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
            {libraryTotal.toLocaleString()} pets
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            <button
              className="btn-pill"
              disabled={libraryPage <= 1 || libraryLoading}
              onClick={() => handlePageChange(libraryPage - 1)}
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              Previous
            </button>

            <span>Page</span>
            <input
              type="number"
              min="1"
              max={libraryTotalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGoPage()}
              style={{
                width: 54,
                padding: '3px 6px',
                textAlign: 'center',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.12)',
                background: 'var(--color-bg)',
                fontSize: 12
              }}
            />
            <span>/ {libraryTotalPages}</span>

            <button
              className="btn-pill"
              onClick={handleGoPage}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              Go
            </button>

            <button
              className="btn-pill"
              disabled={libraryPage >= libraryTotalPages || libraryLoading}
              onClick={() => handlePageChange(libraryPage + 1)}
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              Next
            </button>
          </div>
        </div>

        {/* Filter / Sort / Search Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20
          }}
        >
          {/* Sort Buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {SORTS.map((s) => {
              const isSortActive = librarySort === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSortChange(s.id)}
                  style={{
                    background: isSortActive ? 'var(--color-blue)' : 'var(--color-bg)',
                    color: isSortActive ? '#ffffff' : 'var(--color-text-secondary)',
                    border: `1px solid ${isSortActive ? 'var(--color-blue)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: 9999,
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: isSortActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 6, width: 280 }}>
            <input
              id="library-search-input"
              className="input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search 3,000+ pets..."
              style={{ fontSize: 12, padding: '6px 12px' }}
            />
            <button type="submit" className="btn-pill" style={{ padding: '6px 12px', fontSize: 12 }}>
              Find
            </button>
          </form>
        </div>

        {/* Loading Indicator */}
        {libraryLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: 14 }}>
            Loading Codex Pets...
          </div>
        )}

        {/* Real Live Pets Grid (Exact Match of Screenshot) */}
        {!libraryLoading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16
            }}
          >
            {libraryPets.map((pet) => {
              const isInstalled = installedSlugs.has(pet.id);
              const isActive = activePet?.slug === pet.id;
              const isBusy = installingId === pet.id;
              const isCopied = copiedId === pet.id;
              const spriteUrl = pet.spritesheetUrl || `https://codex-pets.net/assets/pets/v/${pet.id}/spritesheet.webp`;
              const previewImg = pet.previewUrl || pet.posterUrl;

              return (
                <div
                  key={pet.id}
                  id={`codex-pet-${pet.id}`}
                  style={{
                    background: 'var(--color-bg)',
                    border: `1px solid ${isActive ? 'var(--color-blue)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: 18,
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isActive ? '0 4px 16px rgba(37, 99, 235, 0.12)' : 'none',
                    transition: 'transform 140ms ease, box-shadow 140ms ease'
                  }}
                >
                  {/* Card Image Stage */}
                  <div
                    style={{
                      height: 140,
                      background: '#F8F8F6',
                      backgroundImage:
                        'linear-gradient(45deg, #EFEFE9 25%, transparent 25%), linear-gradient(-45deg, #EFEFE9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EFEFE9 75%), linear-gradient(-45deg, transparent 75%, #EFEFE9 75%)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      padding: 4
                    }}
                  >
                    <CodexSpritePlayer
                      src={spriteUrl || previewImg}
                      state="idle"
                      width={110}
                      height={120}
                    />
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Title + Stats Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={pet.displayName}
                      >
                        {pet.displayName}
                      </div>

                      {/* Stat Counters */}
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-3)',
                          display: 'flex',
                          gap: 6,
                          flexShrink: 0
                        }}
                      >
                        <span>👁 {pet.viewCount || 0}</span>
                        <span>🤍 {pet.likeCount || 0}</span>
                      </div>
                    </div>

                    {/* Author */}
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      by <span style={{ textDecoration: 'underline' }}>{pet.id.split('-')[0] || 'creator'}</span>
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.35,
                        margin: '8px 0 10px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1
                      }}
                    >
                      {pet.description || 'Codex animated companion.'}
                    </p>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                      {(pet.tags || [pet.kind || 'pet']).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          style={{
                            background: 'rgba(0,0,0,0.04)',
                            color: 'var(--color-text-secondary)',
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 6
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                      {isActive ? (
                        <button
                          disabled
                          style={{
                            flex: 1,
                            background: 'var(--color-blue-soft)',
                            color: 'var(--color-blue)',
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            borderRadius: 9999,
                            padding: '6px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'default',
                            textAlign: 'center'
                          }}
                        >
                          ✓ Active
                        </button>
                      ) : isInstalled ? (
                        <button
                          className="btn-pill"
                          style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '6px 10px' }}
                          onClick={() => setActive(pet.id)}
                        >
                          Select Pet
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '6px 10px' }}
                          onClick={() => handleDownload(pet)}
                          disabled={isBusy}
                        >
                          {isBusy ? 'Downloading...' : '⬇ Download'}
                        </button>
                      )}

                      {/* Copy NPX Button */}
                      <button
                        className="btn-pill"
                        title={`Copy "npx fumii add ${pet.id}"`}
                        onClick={() => copyNpxCommand(pet.id)}
                        style={{ padding: '6px 10px', fontSize: 11, flexShrink: 0 }}
                      >
                        {isCopied ? '✓' : 'npx'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
