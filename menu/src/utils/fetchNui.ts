export async function fetchNui<T = any>(
  eventName: string,
  data?: any
): Promise<T> {
  const options = {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(data),
  };

  if (process.env.NODE_ENV === 'development') {
    console.group(`DEBUG | POST Request | ${eventName}`)
    console.dir(data)
    console.groupEnd()
  }

  try {
    const resp = await fetch(
      `https://monitor/${eventName}`,
      options
    );

    return await resp.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}
