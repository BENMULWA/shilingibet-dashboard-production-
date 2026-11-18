import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Checkbox, Empty, Form, Input, Modal, Select, Skeleton, Tag, message } from "antd";
import { FiLock, FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import { createRole, deleteRole, listRoles, updateRole } from "../services/staffService";

// Super admins define what each staff role can do. The API enforces these
// permissions on every request; changes reach signed-in staff on their next
// page load and the API within about 30 seconds.
function Roles() {
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({ queryKey: ["staff-roles"], queryFn: listRoles });
  const roles = useMemo(() => rolesQuery.data?.roles || [], [rolesQuery.data]);
  const catalog = useMemo(() => rolesQuery.data?.permissions || [], [rolesQuery.data]);

  const groups = useMemo(() => {
    const byGroup = new Map();
    catalog.forEach((permission) => {
      if (!byGroup.has(permission.group)) byGroup.set(permission.group, []);
      byGroup.get(permission.group).push(permission);
    });
    return [...byGroup.entries()];
  }, [catalog]);

  const [selectedKey, setSelectedKey] = useState(null);
  const selected = roles.find((role) => role.key === selectedKey) || roles[0];

  const [draft, setDraft] = useState(null);
  useEffect(() => {
    if (selected) {
      setDraft({ name: selected.name, description: selected.description, permissions: selected.permissions });
    }
  }, [selected]);

  const dirty = Boolean(
    selected && draft && (
      draft.name !== selected.name ||
      draft.description !== selected.description ||
      [...draft.permissions].sort().join() !== [...selected.permissions].sort().join()
    )
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
  const saveMutation = useMutation({ mutationFn: ({ key, changes }) => updateRole(key, changes) });
  const createMutation = useMutation({ mutationFn: createRole });
  const deleteMutation = useMutation({ mutationFn: deleteRole });

  const selectRole = (key) => {
    if (key === selected?.key) return;
    if (!dirty) {
      setSelectedKey(key);
      return;
    }
    Modal.confirm({
      title: "Discard unsaved changes?",
      content: `Your changes to ${selected.name} have not been saved.`,
      okText: "Discard",
      okButtonProps: { danger: true },
      onOk: () => setSelectedKey(key),
    });
  };

  const togglePermission = (key, checked) => {
    setDraft((current) => ({
      ...current,
      permissions: checked
        ? [...new Set([...current.permissions, key])]
        : current.permissions.filter((permission) => permission !== key),
    }));
  };

  const toggleGroup = (permissions, checked) => {
    const keys = permissions.map((permission) => permission.key);
    setDraft((current) => ({
      ...current,
      permissions: checked
        ? [...new Set([...current.permissions, ...keys])]
        : current.permissions.filter((permission) => !keys.includes(permission)),
    }));
  };

  const save = () => {
    const added = draft.permissions.filter((key) => !selected.permissions.includes(key));
    const removed = selected.permissions.filter((key) => !draft.permissions.includes(key));
    const label = (key) => catalog.find((permission) => permission.key === key)?.label || key;

    Modal.confirm({
      title: `Save changes to ${selected.name}?`,
      width: 520,
      content: (
        <div className="space-y-2 text-sm">
          <p>
            This affects {selected.staffCount} staff account{selected.staffCount === 1 ? "" : "s"}.
          </p>
          {added.length > 0 && (
            <div>
              <p className="font-medium text-emerald-700">Can now:</p>
              <ul className="list-disc pl-5">{added.map((key) => <li key={key}>{label(key)}</li>)}</ul>
            </div>
          )}
          {removed.length > 0 && (
            <div>
              <p className="font-medium text-red-700">Can no longer:</p>
              <ul className="list-disc pl-5">{removed.map((key) => <li key={key}>{label(key)}</li>)}</ul>
            </div>
          )}
        </div>
      ),
      okText: "Save role",
      onOk: async () => {
        try {
          await saveMutation.mutateAsync({
            key: selected.key,
            changes: { name: draft.name.trim(), description: draft.description.trim(), permissions: draft.permissions },
          });
          message.success("Role saved");
          await refresh();
        } catch (error) {
          message.error(error.message || "Unable to save role");
          throw error;
        }
      },
    });
  };

  const remove = () => {
    Modal.confirm({
      title: `Delete the ${selected.name} role?`,
      content: "Roles still assigned to staff cannot be deleted. Move those staff to another role first.",
      okText: "Delete role",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(selected.key);
          message.success("Role deleted");
          setSelectedKey(null);
          await refresh();
        } catch (error) {
          message.error(error.message || "Unable to delete role");
          throw error;
        }
      },
    });
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const closeCreate = () => {
    setCreateOpen(false);
    createForm.resetFields();
  };
  const submitCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const template = roles.find((role) => role.key === values.copyFrom);
      const response = await createMutation.mutateAsync({
        name: values.name,
        description: values.description || "",
        permissions: template ? template.permissions : [],
      });
      message.success("Role created. Choose its permissions, then save.");
      closeCreate();
      await refresh();
      setSelectedKey(response.data.key);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Unable to create role");
    }
  };

  if (rolesQuery.isLoading) {
    return <div className="rounded-xl bg-white p-6 dark:bg-slate-800"><Skeleton active paragraph={{ rows: 8 }} /></div>;
  }

  if (rolesQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load roles"
        description={rolesQuery.error?.message}
        action={<Button onClick={() => rolesQuery.refetch()}>Retry</Button>}
      />
    );
  }

  const locked = selected?.locked;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Roles & Permissions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose what each staff role can see and change. Assign roles to people on the Staff page.
          </p>
        </div>
        <Button type="primary" icon={<FiPlus />} onClick={() => setCreateOpen(true)}>New role</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Roles" className="flex gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm dark:bg-slate-800 lg:flex-col lg:overflow-visible">
          {roles.map((role) => {
            const active = role.key === selected?.key;
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => selectRole(role.key)}
                aria-current={active ? "true" : undefined}
                className={`min-w-44 rounded-lg px-3 py-2.5 text-left transition-colors lg:min-w-0 ${
                  active
                    ? "bg-[#ffc107]/20 text-slate-900 ring-1 ring-[#ffc107] dark:text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {role.name}
                  {role.locked && <FiLock size={12} aria-label="Locked" />}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {role.staffCount} staff · {role.locked ? "all" : role.permissions.length} permission{role.permissions.length === 1 && !role.locked ? "" : "s"}
                </span>
              </button>
            );
          })}
        </nav>

        {selected && draft ? (
          <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <Tag>{selected.key}</Tag>
              {selected.system && <Tag color="blue">Built-in</Tag>}
              {locked && <Tag color="gold">Always full access</Tag>}
            </div>

            {locked && (
              <Alert
                type="info"
                showIcon
                message="Super Admin always has every permission"
                description="Only super admins can manage staff accounts and roles. This role cannot be narrowed, so the back office can never be locked out."
              />
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Name</span>
                <Input
                  value={draft.name}
                  maxLength={60}
                  disabled={locked}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Description</span>
                <Input
                  value={draft.description}
                  maxLength={200}
                  disabled={locked}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {groups.map(([group, permissions]) => {
                const checkedCount = permissions.filter((permission) => draft.permissions.includes(permission.key)).length;
                return (
                  <fieldset key={group} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <legend className="px-1">
                      <Checkbox
                        checked={checkedCount === permissions.length}
                        indeterminate={checkedCount > 0 && checkedCount < permissions.length}
                        disabled={locked}
                        onChange={(event) => toggleGroup(permissions, event.target.checked)}
                      >
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{group}</span>
                      </Checkbox>
                    </legend>
                    <div className="flex flex-col gap-1.5">
                      {permissions.map((permission) => (
                        <Checkbox
                          key={permission.key}
                          checked={draft.permissions.includes(permission.key)}
                          disabled={locked}
                          onChange={(event) => togglePermission(permission.key, event.target.checked)}
                        >
                          <span className="text-sm text-slate-700 dark:text-slate-300">{permission.label}</span>
                        </Checkbox>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>

            {!locked && (
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-700 sm:flex-row sm:justify-between">
                {!selected.system ? (
                  <Button danger icon={<FiTrash2 />} onClick={remove} loading={deleteMutation.isPending}>
                    Delete role
                  </Button>
                ) : <span />}
                <div className="flex gap-2">
                  <Button
                    disabled={!dirty}
                    onClick={() => setDraft({ name: selected.name, description: selected.description, permissions: selected.permissions })}
                  >
                    Undo changes
                  </Button>
                  <Button
                    type="primary"
                    icon={<FiSave />}
                    disabled={!dirty || draft.name.trim().length < 2}
                    loading={saveMutation.isPending}
                    onClick={save}
                  >
                    Save role
                  </Button>
                </div>
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-xl bg-white p-10 dark:bg-slate-800"><Empty description="No roles yet" /></div>
        )}
      </div>

      <Modal
        title="New role"
        open={createOpen}
        onCancel={closeCreate}
        onOk={submitCreate}
        okText="Create role"
        confirmLoading={createMutation.isPending}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, min: 2, max: 60, message: "Enter a name of 2 to 60 characters" }]}
          >
            <Input placeholder="e.g. VIP Desk" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ max: 200 }]}>
            <Input placeholder="What this team does" />
          </Form.Item>
          <Form.Item name="copyFrom" label="Start from" extra="Copies another role's permissions. You can change them after.">
            <Select
              allowClear
              placeholder="No permissions"
              options={roles.filter((role) => !role.locked).map((role) => ({ value: role.key, label: role.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Roles;
