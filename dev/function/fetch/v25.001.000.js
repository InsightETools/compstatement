function buildFetchUrlFromParams() {
  const p = getParams();
  const key    = p.get("key");
  const cpid   = p.get("cpid");
  const yr     = p.get("yr");
  const ck     = p.get("ck");
  const ek     = p.get("ek") || "EmployeeA";
  const layout = p.get("layout");

  const baseUrl = "https://etools.secure-solutions.biz/totalcompadmin/design/ClientParamsExplorer.aspx";

  if (!key) {
    return `https://compstatementdemo.netlify.app/data/${ek}.json`;
  }

  const qp = new URLSearchParams({
    usecors: "1",
    key, cpid, yr, ck, ek, layout,
  });

  return `${baseUrl}?${qp.toString()}`;
}
