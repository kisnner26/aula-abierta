import { useState, useRef, useDeferredValue } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Plus, Upload, Users, Trash2, Pencil, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Avatar, Badge, Button, Card, Input, Modal, SectionHeader, Skeleton, Table, toast, WorkspaceHero } from '@core/ui'
import type { Column } from '@core/ui'
import { adminApi } from '../api'
import { RoleLabel } from '@core/types/roles'
import { useAuthStore } from '@core/auth/authStore'
import type { User } from '@core/types/models'
import type { Role } from '@core/types/roles'

const emptyForm = { name: '', sis_id: '', password: '', role: 'student' as Role }

export default function UsersPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const currentUser = useAuthStore((s) => s.user)

  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: '', role: 'student' as Role, password: '' })

  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, roleFilter, deferredSearch],
    queryFn:  () => adminApi.getUsers({
      page,
      role: roleFilter || undefined,
      search: deferredSearch || undefined,
    }),
    placeholderData: keepPreviousData,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] })

  const create = useMutation({
    mutationFn: () => adminApi.createUser({ ...form }),
    onSuccess: () => {
      toast.success('User created.')
      invalidate()
      setShowCreate(false)
      setForm(emptyForm)
    },
    onError: () => toast.error('Failed to create user. Check the SIS ID is unique and the password has at least 8 characters.'),
  })

  const update = useMutation({
    mutationFn: (u: User) => adminApi.updateUser(u.id, {
      name: editForm.name,
      role: editForm.role,
      ...(editForm.password ? { password: editForm.password } : {}),
    }),
    onSuccess: () => {
      toast.success('User updated.')
      invalidate()
      setEditUser(null)
    },
    onError: () => toast.error('Failed to update user.'),
  })

  const destroy = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success('User removed.')
      invalidate()
    },
    onError: () => toast.error('Failed to delete user.'),
  })

  const importUsers = useMutation({
    mutationFn: (file: File) => adminApi.bulkImport(file),
    onSuccess: (res) => {
      setImportResult(res)
      invalidate()
    },
    onError: () => toast.error('Import failed. Check the file format.'),
  })

  const openEdit = (u: User) => {
    setEditUser(u)
    setEditForm({ name: u.name, role: u.role, password: '' })
  }

  const roleOptions = Object.entries(RoleLabel) as [Role, string][]

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} role={u.role} size="sm" />
          <div>
            <p className="text-sm font-semibold text-neutral-800">{u.name}</p>
            <p className="text-xs text-neutral-400">{u.sis_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <Badge status="info" label={RoleLabel[u.role]} />,
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => openEdit(u)}
            className="text-neutral-300 transition-colors hover:text-brand-blue"
            aria-label={`Edit ${u.name}`}
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          {u.id !== currentUser?.id && (
            <button
              onClick={() => { if (window.confirm(`Remove ${u.name}?`)) destroy.mutate(u.id) }}
              className="text-neutral-300 transition-colors hover:text-brand-red"
              aria-label={`Delete ${u.name}`}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="USER MANAGEMENT"
          title="Users"
          description={`${users?.meta.total ?? 0} total accounts — create, import, and manage all students, trainers, and coordinators.`}
          image="placeholder"
          imageAlt="Aula Abierta illustration managing user profiles"
          tone="blue"
          imagePosition="object-[60%_center]"
        />

        <section aria-labelledby="users-list-title">
          <SectionHeader
            eyebrow="SYSTEM ACCOUNTS"
            title="All users"
            titleId="users-list-title"
            action={
              <div className="flex gap-2">
                <Button variant="secondary" leftIcon={<Upload size={15} />} onClick={() => setShowImport(true)}>
                  Bulk Import
                </Button>
                <Button leftIcon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
                  New User
                </Button>
              </div>
            }
          />

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name or SIS ID…"
                aria-label="Search users"
                className="w-64 rounded-input border border-neutral-300 py-2 pl-9 pr-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              aria-label="Filter by role"
              className="rounded-input border border-neutral-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="">All roles</option>
              {roleOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <Card padding="none">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-6">
                {[0, 1, 2, 3, 4].map((i) => <Skeleton.Line key={i} height={56} />)}
              </div>
            ) : (
              <Table
                columns={columns}
                data={users?.data ?? []}
                rowKey={(u) => u.id}
                emptyTitle="No users found"
                emptyDescription="Try adjusting the search or role filter."
                emptyIcon={<Users size={22} />}
              />
            )}
          </Card>

          {users && users.meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                leftIcon={<ChevronLeft size={15} />}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-neutral-500">
                Page {users.meta.current_page} of {users.meta.last_page} — {users.meta.total} users
              </span>
              <Button
                variant="secondary"
                leftIcon={<ChevronRight size={15} />}
                disabled={page >= users.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </section>

        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="New User"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                onClick={() => create.mutate()}
                loading={create.isPending}
                disabled={!form.name || !form.sis_id || !form.password}
              >
                Create
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Input label="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth autoFocus />
            <Input label="SIS ID" value={form.sis_id} onChange={(e) => setForm((p) => ({ ...p, sis_id: e.target.value }))} fullWidth />
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} fullWidth />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))}
                className="rounded-input border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {roleOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>

        <Modal
          open={editUser !== null}
          onClose={() => setEditUser(null)}
          title={`Edit ${editUser?.name ?? ''}`}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button
                onClick={() => editUser && update.mutate(editUser)}
                loading={update.isPending}
                disabled={!editForm.name}
              >
                Save changes
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Input label="Full name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} fullWidth autoFocus />
            <Input
              label="New password (leave blank to keep current)"
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
              fullWidth
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as Role }))}
                disabled={editUser?.id === currentUser?.id}
                className="rounded-input border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-neutral-100"
              >
                {roleOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {editUser?.id === currentUser?.id && (
                <p className="text-xs text-neutral-400">You cannot change your own role.</p>
              )}
            </div>
          </div>
        </Modal>

        <Modal
          open={showImport}
          onClose={() => { setShowImport(false); setImportResult(null) }}
          title="Bulk Import Users"
          size="sm"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importUsers.mutate(f)
            }}
          />
          {importResult ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-green-700">{importResult.created} users imported.</p>
              {importResult.errors.length > 0 && (
                <div className="rounded-input border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-xs font-bold text-brand-red">Errors</p>
                  <ul className="space-y-0.5 text-xs text-red-700">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              <Button onClick={() => { setShowImport(false); setImportResult(null) }}>Done</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-neutral-600">
                Upload an Excel (.xlsx) file with columns:{' '}
                <code className="rounded bg-neutral-100 px-1 text-xs">name, sis_id, role, password</code>.
                Rows with errors are skipped and reported.
              </p>
              <Button
                onClick={() => fileRef.current?.click()}
                loading={importUsers.isPending}
                leftIcon={<Upload size={15} />}
                fullWidth
              >
                Select file to import
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  )
}
