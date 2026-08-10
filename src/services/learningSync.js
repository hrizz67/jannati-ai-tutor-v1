export async function loadCloudLearningData(client) {
  if (!client) return null;
  try {
    const { data, error } = await client.rpc('get_learning_data');
    if (error || !data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

export async function saveCloudLearningData(client, payload = {}) {
  if (!client || !payload || typeof payload !== 'object') return false;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { error } = await client.rpc('save_learning_data', { payload });
      if (!error) return true;
    } catch {
      // Retry once for a transient mobile/network failure.
    }
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  return false;
}
