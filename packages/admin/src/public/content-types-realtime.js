export function hasRealtimeActions(item) {
  const actions = readRealtimeActions(item);
  return actions.create || actions.delete || actions.update;
}

export function readRealtimeActions(item) {
  const actions = item.realtimeActions ?? {};
  const fallback = Boolean(item.realtimeEnabled);

  return {
    create: typeof actions.create === 'boolean' ? actions.create : fallback,
    delete: typeof actions.delete === 'boolean' ? actions.delete : fallback,
    update: typeof actions.update === 'boolean' ? actions.update : fallback,
  };
}

export function readRealtimeActionsFromForm(refs) {
  return {
    create: refs.realtimeCreate.checked,
    delete: refs.realtimeDelete.checked,
    update: refs.realtimeUpdate.checked,
  };
}

export function setRealtimeActions(refs, actions) {
  refs.realtimeCreate.checked = Boolean(actions.create);
  refs.realtimeDelete.checked = Boolean(actions.delete);
  refs.realtimeUpdate.checked = Boolean(actions.update);
}

export function syncRealtimeControls(refs) {
  if (refs.realtimeEnabled.disabled) {
    return;
  }

  const enabled = refs.realtimeEnabled.checked;
  refs.realtimeActions.querySelectorAll('input[type="checkbox"]').forEach((control) => {
    control.disabled = !enabled;
  });
}
