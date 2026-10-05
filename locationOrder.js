export const normalizeLocationOrder = (locations = []) =>
  locations
    .map((location, index) => ({
      location,
      index,
      order: Number.isInteger(location.order) && location.order >= 0 ? location.order : index,
    }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ location }, order) => ({ ...location, order }));

export const moveLocation = (locations, locationId, targetIndex) => {
  const ordered = normalizeLocationOrder(locations);
  const sourceIndex = ordered.findIndex(location => location.id === locationId);
  if (sourceIndex < 0 || !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= ordered.length) {
    return ordered;
  }
  const [location] = ordered.splice(sourceIndex, 1);
  ordered.splice(targetIndex, 0, location);
  return ordered.map((item, order) => ({ ...item, order }));
};

export const orderLocationEntries = (data, locationNames) => {
  const order = new Map();
  locationNames.forEach((name, index) => {
    if (!order.has(name)) order.set(name, index);
  });
  return Object.entries(data).sort((a, b) =>
    (order.get(a[0]) ?? Infinity) - (order.get(b[0]) ?? Infinity));
};
