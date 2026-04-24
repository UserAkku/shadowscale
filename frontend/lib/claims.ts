export interface Claim {
  claimToken: string;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
}

export function getClaims(): Claim[] {
  if (typeof window === "undefined") return [];
  const claims = localStorage.getItem("shadowscale_claims");
  return claims ? JSON.parse(claims) : [];
}

export function addClaim(claim: Claim) {
  if (typeof window === "undefined") return;
  const claims = getClaims();
  claims.push(claim);
  localStorage.setItem("shadowscale_claims", JSON.stringify(claims));
}

export function removeClaim(claimToken: string) {
  if (typeof window === "undefined") return;
  const claims = getClaims();
  const newClaims = claims.filter(c => c.claimToken !== claimToken);
  localStorage.setItem("shadowscale_claims", JSON.stringify(newClaims));
}

export function clearClaims() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("shadowscale_claims");
}
