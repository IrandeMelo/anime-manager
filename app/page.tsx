'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { neon } from '@/lib/neon';

type AnimeStatus = 'watching' | 'paused' | 'completed' | 'planned';

type Anime = {
  id: string;
  name: string;
  season: number;
  current_episode: number;
  status: AnimeStatus;
  updated_at: string;
};

const labels: Record<AnimeStatus, string> = {
  watching: 'Assistindo',
  paused: 'Pausado',
  completed: 'Concluído',
  planned: 'Quero assistir',
};

const statusOrder: AnimeStatus[] = ['watching', 'paused', 'planned', 'completed'];

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Anime | null>(null);
  const [filter, setFilter] = useState<'all' | AnimeStatus>('all');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await neon.auth.getSession();
        setSession(data ?? null);
      } finally {
        setLoadingSession(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (session?.user) loadAnimes();
  }, [session]);

  async function loadAnimes() {
    const { data, error } = await neon
      .from('animes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error) setAnimes((data ?? []) as Anime[]);
  }

  async function handleAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError('');

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const name = String(form.get('name') || '').trim();

    try {
      const result = mode === 'signup'
        ? await neon.auth.signUp.email({
            email,
            password,
            name: name || email.split('@')[0],
          })
        : await neon.auth.signIn.email({ email, password });

      if (result.error) {
        setAuthError(result.error.message || 'Não foi possível autenticar.');
        return;
      }

      const { data } = await neon.auth.getSession();
      setSession(data ?? null);
    } catch {
      setAuthError('Falha de conexão. Tente novamente.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    await neon.auth.signOut();
    setSession(null);
    setAnimes([]);
  }

  async function saveAnime(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || '').trim(),
      season: Math.max(1, Number(form.get('season') || 1)),
      current_episode: Math.max(0, Number(form.get('episode') || 0)),
      status: String(form.get('status') || 'watching') as AnimeStatus,
    };

    if (editing) {
      await neon.from('animes').update(payload).eq('id', editing.id);
    } else {
      await neon.from('animes').insert(payload);
    }

    setEditing(null);
    setShowForm(false);
    await loadAnimes();
    setBusy(false);
  }

  async function changeEpisode(anime: Anime, delta: number) {
    const next = Math.max(0, anime.current_episode + delta);

    setAnimes((prev) =>
      prev.map((a) =>
        a.id === anime.id ? { ...a, current_episode: next } : a
      )
    );

    const { error } = await neon
      .from('animes')
      .update({ current_episode: next })
      .eq('id', anime.id);

    if (error) await loadAnimes();
  }

  async function deleteAnime(anime: Anime) {
    if (!window.confirm(`Excluir ${anime.name}?`)) return;

    await neon.from('animes').delete().eq('id', anime.id);
    await loadAnimes();
  }

  const visible = useMemo(
    () => (filter === 'all' ? animes : animes.filter((a) => a.status === filter)),
    [animes, filter]
  );

  if (loadingSession) {
    return (
      <main className="center">
        <div className="loader" />
        <p>Carregando…</p>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-mark">A</div>
          <h1>AnimeTrack</h1>
          <p className="muted">Seu progresso de anime, sem complicação.</p>

          <div className="auth-tabs">
            <button
              className={mode === 'signin' ? 'active' : ''}
              onClick={() => setMode('signin')}
            >
              Entrar
            </button>
            <button
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => setMode('signup')}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleAuth} className="form-stack">
            {mode === 'signup' && (
              <label>
                Nome
                <input name="name" required placeholder="Seu nome" />
              </label>
            )}

            <label>
              E-mail
              <input
                name="email"
                type="email"
                required
                placeholder="voce@email.com"
              />
            </label>

            <label>
              Senha
              <input
                name="password"
                type="password"
                minLength={8}
                required
                placeholder="Mínimo de 8 caracteres"
              />
            </label>

            {authError && <p className="error">{authError}</p>}

            <button className="primary" disabled={authBusy}>
              {authBusy
                ? 'Aguarde…'
                : mode === 'signin'
                  ? 'Entrar'
                  : 'Criar conta'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">AnimeTrack</span>
          <h1>Meus animes</h1>
        </div>

        <div className="top-actions">
          <button className="ghost" onClick={logout}>
            Sair
          </button>
          <button
            className="primary small"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + Anime
          </button>
        </div>
      </header>

      <nav className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Todos <span>{animes.length}</span>
        </button>

        {statusOrder.map((s) => (
          <button
            key={s}
            className={filter === s ? 'active' : ''}
            onClick={() => setFilter(s)}
          >
            {labels[s]} <span>{animes.filter((a) => a.status === s).length}</span>
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <section className="empty">
          <div className="empty-icon">◉</div>
          <h2>Nenhum anime aqui</h2>
          <p>
            Adicione seu primeiro anime para começar a acompanhar o progresso.
          </p>
          <button className="primary" onClick={() => setShowForm(true)}>
            Adicionar anime
          </button>
        </section>
      ) : (
        <section className="grid">
          {visible.map((anime) => (
            <article className="anime-card" key={anime.id}>
              <div className="card-head">
                <div>
                  <h2>{anime.name}</h2>
                  <p>Temporada {anime.season}</p>
                </div>
                <span className={`badge ${anime.status}`}>
                  {labels[anime.status]}
                </span>
              </div>

              <div className="episode-row">
                <div>
                  <span className="episode-label">Episódio atual</span>
                  <strong>{anime.current_episode}</strong>
                  <small>Próximo: {anime.current_episode + 1}</small>
                </div>

                <div className="stepper">
                  <button onClick={() => changeEpisode(anime, -1)}>−</button>
                  <button onClick={() => changeEpisode(anime, 1)}>+</button>
                </div>
              </div>

              <div className="card-actions">
                <button
                  onClick={() => {
                    setEditing(anime);
                    setShowForm(true);
                  }}
                >
                  Editar
                </button>
                <button className="danger" onClick={() => deleteAnime(anime)}>
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={() => !busy && setShowForm(false)}
        >
          <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">{editing ? 'Editar' : 'Novo'}</span>
                <h2>{editing ? editing.name : 'Adicionar anime'}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveAnime} className="form-stack">
              <label>
                Nome
                <input
                  name="name"
                  required
                  defaultValue={editing?.name ?? ''}
                  placeholder="Ex.: Frieren"
                />
              </label>

              <div className="two-cols">
                <label>
                  Temporada
                  <input
                    name="season"
                    type="number"
                    min="1"
                    required
                    defaultValue={editing?.season ?? 1}
                  />
                </label>

                <label>
                  Episódio atual
                  <input
                    name="episode"
                    type="number"
                    min="0"
                    required
                    defaultValue={editing?.current_episode ?? 0}
                  />
                </label>
              </div>

              <label>
                Status
                <select
                  name="status"
                  defaultValue={editing?.status ?? 'watching'}
                >
                  {statusOrder.map((s) => (
                    <option value={s} key={s}>
                      {labels[s]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button className="primary" disabled={busy}>
                  {busy ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
