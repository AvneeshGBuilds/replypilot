// Google Business Profile API helpers

export async function listLocations(accessToken: string) {
  const res = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to fetch accounts");

  const accounts: { name: string }[] = data.accounts || [];
  const locations: { name: string; title: string; accountId: string }[] = [];

  for (const account of accounts) {
    const accountId = account.name.split("/")[1];
    const locRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const locData = await locRes.json();
    for (const loc of locData.locations || []) {
      locations.push({ ...loc, accountId });
    }
  }

  return locations;
}

export async function fetchUnansweredReviews(
  accessToken: string,
  locationName: string
) {
  const allReviews: unknown[] = [];
  let pageToken = "";

  do {
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?orderBy=updateTime+desc&pageSize=50${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to fetch reviews");
    allReviews.push(...(data.reviews || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return allReviews.filter((r: unknown) => !(r as { reviewReply?: unknown }).reviewReply);
}

export async function fetchNewReviews(
  accessToken: string,
  locationName: string,
  since: string // ISO date string
) {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews?orderBy=updateTime+desc&pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to fetch reviews");

  const sinceDate = new Date(since);
  return (data.reviews || []).filter(
    (r: { updateTime: string }) => new Date(r.updateTime) > sinceDate
  );
}

export async function postReply(
  accessToken: string,
  locationName: string,
  reviewId: string,
  replyText: string
) {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews/${reviewId}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: replyText }),
    }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || "Failed to post reply");
  }
}
