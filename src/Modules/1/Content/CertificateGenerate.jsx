import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import imgCertificate from "./../../../assets/Apple 250.png";

const API = {
  POST: "http://localhost:5555/auth/api/ngo/post/postCertificate",
  GET_ALL: "http://localhost:5555/auth/api/ngo/get/getAllCertificates",
  GET_BY_ID: (id) =>
    `http://localhost:5555/auth/api/ngo/get/getCertificateById/${id}`,
  UPDATE_STATUS: (id) =>
    `http://localhost:5555/auth/api/ngo/update/updateCertificateStatus/${id}`,
  DELETE: (id) =>
    `http://localhost:5555/auth/api/ngo/delete/deleteCertificate/${id}`,
};

export default function CertificateGenerate({
  presidentName = "Keerti Sharma",
  viceName = "Pradeep Ingalkar",
  logo = imgCertificate,
}) {
  const currentUser = useSelector((s) => s.user.currentUser);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  // const [info, setInfo] = useState("");
  const [printName, setPrintName] = useState("");
  const hiddenRef = useRef(null);

  useEffect(() => {
    if (currentUser?.name) setName(currentUser.name);
    fetchList();
  }, []);

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const res = await axios.get(API.GET_ALL);
      setList(res.data?.data ?? []);
    } catch (err) {
      setError("Unable to fetch list");
    } finally {
      setLoadingList(false);
    }
  };

  const waitForImages = (node, timeout = 5000) => {
    return new Promise((resolve) => {
      if (!node) return resolve();
      const imgs = Array.from(node.querySelectorAll("img"));
      if (imgs.length === 0) return resolve();
      let loaded = 0;
      const check = () => {
        loaded++;
        if (loaded >= imgs.length) resolve();
      };
      imgs.forEach((img) => {
        if (img.complete) check();
        else {
          img.addEventListener("load", check, { once: true });
          img.addEventListener("error", check, { once: true });
        }
      });
      setTimeout(() => resolve(), timeout);
    });
  };

  const openNewTabWithContent = async (innerHTML, title = "Certificate") => {
    const styles = `
      <style>
        @page { size: A4; margin: 0; }
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #fff;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: 'Poppins', sans-serif;
        }
        .certificate {
          position: relative;
          width: 90%;
          max-width: 1000px;
          background: #fff7e6;
          border: 12px solid #f79e1b;
          padding: 60px 80px;
          box-sizing: border-box;
          border-radius: 8px;
        }
        .corner {
          position: absolute;
          width: 160px;
          height: 160px;
          background: linear-gradient(135deg, #ffa726 0%, #f57c00 100%);
        }
        .corner.top-left { top: 0; left: 0; clip-path: polygon(0 0, 100% 0, 0 100%); }
        .corner.bottom-right { bottom: 0; right: 0; clip-path: polygon(100% 100%, 0 100%, 100% 0); }
        .header { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
        .logo { width: 100px; height: 100px; border-radius: 50%; background: #fff; display: flex; justify-content: center; align-items: center; box-shadow: inset 0 0 8px rgba(0,0,0,0.1); }
        .header-text { text-align: left; color: #0d2b5b; }
        .header-text h1 { font-size: 34px; margin: 0; font-weight: 800; }
        .header-text h2 { font-size: 26px; margin: -5px 0 0 0; font-weight: 600; }
        .title { text-align: center; color: #0d2b5b; font-size: 40px; font-weight: 800; margin-top: 30px; line-height: 1.1; }
        .subtitle { text-align: center; color: #0d2b5b; font-size: 16px; margin-top: 10px; }
        .recipient { text-align: center; margin-top: 25px; color: #0d2b5b; }
        .recipient-name { font-size: 42px; font-weight: 700; margin-top: 10px; }
        hr { width: 65%; margin: 30px auto; border: none; border-top: 1px solid #ccc; }
        .description { text-align: center; color: #0d2b5b; font-size: 17px; line-height: 1.4; }
        .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 30px; }
        .sign-block { text-align: center; color: #0d2b5b; }
        .sign-block .name { font-weight: 600; font-size: 18px; }
        .sign-block .role { font-size: 14px; opacity: 0.8; }
      </style>
    `;

    const html = `
      <html><head><title>${title}</title>${styles}</head>
      <body>${innerHTML}</body></html>
    `;

    const newTab = window.open("", "_blank");
    newTab.document.open();
    newTab.document.write(html);
    newTab.document.close();
    newTab.focus();
    setTimeout(() => newTab.print(), 800);
  };

  // const openCertificate = async (certName) => {
  //   await waitForImages(hiddenRef.current);
  //   const inner = hiddenRef.current.innerHTML;
  //   await openNewTabWithContent(inner, `Certificate - ${certName}`);
  // };

  const openCertificate = async (certName) => {
    // ✅ dynamically inject the correct name for printing
    setPrintName(certName);

    // wait a short moment for React to re-render the hidden certificate
    await new Promise((resolve) => setTimeout(resolve, 100));

    await waitForImages(hiddenRef.current);
    const inner = hiddenRef.current.innerHTML;
    await openNewTabWithContent(inner, `Certificate - ${certName}`);

    // optional cleanup
    setTimeout(() => setPrintName(""), 500);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Name required");
    setGenerating(true);
    try {
      const res = await axios.post(API.POST, { name: trimmed });
      const insertId = res?.data?.data?.insertId;
      if (insertId) await handleView(insertId);
      else await openCertificate(trimmed);
      await fetchList();
    } catch {
      setError("Server error while saving");
    } finally {
      setGenerating(false);
    }
  };

  const handleView = async (id) => {
    setProcessing(true);
    try {
      const res = await axios.get(API.GET_BY_ID(id));
      await openCertificate(res.data?.data?.name);
    } catch {
      setError("Unable to open certificate");
    } finally {
      setProcessing(false);
    }
  };

  const toggleStatus = async (id, status) => {
    if (!id) return;
    const newStatus = status === "active" ? "inactive" : "active";
    await axios.put(API.UPDATE_STATUS(id), { status: newStatus });
    fetchList();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this certificate?")) {
      await axios.delete(API.DELETE(id));
      fetchList();
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Form */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="text-lg font-semibold text-[#0d2b5b]">
          Generate Certificate
        </h2>
        <form onSubmit={handleGenerate} className="mt-3 flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter member name"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#0d2b5b] text-white rounded"
          >
            {generating ? "Saving..." : "Generate & Open"}
          </button>
        </form>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>

      {/* List */}
      <div className="bg-white rounded shadow p-4">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold text-[#0d2b5b]">
            Certificates ({list.length})
          </h3>
          <button onClick={fetchList} className="border px-2 py-1 rounded">
            Refresh
          </button>
        </div>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-xs text-left">#</th>
              <th className="p-2 text-xs text-left">Name</th>
              <th className="p-2 text-xs text-left">Date</th>
              <th className="p-2 text-xs text-left">Status</th>
              <th className="p-2 text-xs text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c, i) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{c.name}</td>
                <td className="p-2">{formatDate(c.created_at)}</td>
                <td className="p-2 capitalize">{c.status}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleView(c.id)}
                    className="border px-2 text-xs"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => toggleStatus(c.id, c.status)}
                    className="border px-2 text-xs"
                  >
                    Toggle
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="border px-2 text-xs text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden Certificate for Print */}
      <div
        ref={hiddenRef}
        style={{ position: "fixed", left: -9999, top: 0 }}
        aria-hidden="true"
      >
        <div className="certificate">
          <div className="corner top-left"></div>
          <div className="corner bottom-right"></div>
          <div className="header">
            <div className="logo">
              <img src={logo} alt="Logo" style={{ width: "80%" }} />
            </div>
            <div className="header-text">
              <h1>Future Kids</h1>
              <h2>Foundation</h2>
            </div>
          </div>
          <div className="title">
            CERTIFICATE OF
            <br />
            APPRECIATION
          </div>
          <div className="subtitle">
            This certificate is proudly presented to
          </div>
          <div className="recipient">
            {/* <div className="recipient-name">{name}</div> */}
            <div className="recipient-name">{printName || name}</div>
          </div>
          <hr />
          <div className="description">
            for outstanding participation and contribution
            <br />
            in various foundation activities.
          </div>
          <div className="signatures">
            <div className="sign-block">
              <div className="name">{presidentName}</div>
              <div className="role">President</div>
            </div>
            <div className="sign-block">
              <div className="name">{viceName}</div>
              <div className="role">Vice President</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ********************************************************************
// // CertificateManagerOpenTab.jsx
// import React, { useEffect, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import axios from "axios";
// import Certificate from "./Certificate";
// import imgCertificate from "./../../../assets/Apple 250.png";

// /* API endpoints */
// const API = {
//   POST: "http://localhost:5555/auth/api/ngo/post/postCertificate",
//   GET_ALL: "http://localhost:5555/auth/api/ngo/get/getAllCertificates",
//   GET_BY_ID: (id) =>
//     `http://localhost:5555/auth/api/ngo/get/getCertificateById/${id}`,
//   UPDATE_STATUS: (id) =>
//     `http://localhost:5555/auth/api/ngo/update/updateCertificateStatus/${id}`,
//   DELETE: (id) =>
//     `http://localhost:5555/auth/api/ngo/get/deleteCertificate/${id}`,
// };

// export default function CertificateGenerate({
//   presidentName = "Keerti Sharma",
//   viceName = "Pradeep Ingalkar",
//   logo = imgCertificate,
// }) {
//   const currentUser = useSelector((s) => s.user.currentUser);

//   const [name, setName] = useState(currentUser?.name ?? "");
//   const [list, setList] = useState([]);
//   const [loadingList, setLoadingList] = useState(false);
//   const [generating, setGenerating] = useState(false);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState("");
//   const [info, setInfo] = useState("");

//   const hiddenRef = useRef(null);

//   useEffect(() => {
//     if (currentUser?.name) setName(currentUser.name);
//   }, [currentUser?.name]);

//   useEffect(() => {
//     fetchList();
//   }, []);

//   const fetchList = async () => {
//     setLoadingList(true);
//     setError("");
//     try {
//       const res = await axios.get(API.GET_ALL);
//       setList(res.data?.data ?? []);
//     } catch (err) {
//       console.error(err);
//       setError(err?.response?.data?.error || "Unable to fetch list");
//       setList([]);
//     } finally {
//       setLoadingList(false);
//     }
//   };

//   // utility: wait for images inside node to load (or timeout)
//   const waitForImages = (node, timeout = 3000) => {
//     return new Promise((resolve) => {
//       if (!node) return resolve();
//       const imgs = Array.from(node.querySelectorAll("img"));
//       if (imgs.length === 0) return resolve();
//       let loaded = 0;
//       const check = () => {
//         loaded++;
//         if (loaded >= imgs.length) resolve();
//       };
//       imgs.forEach((img) => {
//         if (img.complete) check();
//         else {
//           img.addEventListener("load", check, { once: true });
//           img.addEventListener("error", check, { once: true });
//         }
//       });
//       // safety timeout
//       setTimeout(() => resolve(), timeout);
//     });
//   };

//   // open new tab with given innerHTML content, topbar with Print & Close
//   const openNewTabWithContent = async (innerHTML, title = "Certificate") => {
//     const styles = `
//       <style>
//         @page { size: A4 landscape; margin: 6mm; }
//         html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial; }
//         .topbar { position: fixed; top: 0; left: 0; right: 0; height: 52px; display:flex; align-items:center; justify-content:flex-end; gap:8px; padding:8px 12px; background: #f8fafc; box-shadow: 0 1px 3px rgba(0,0,0,0.08); z-index: 9999; }
//         .topbar button { padding: 8px 12px; border-radius:6px; border:1px solid #cbd5e1; background:white; cursor:pointer; }
//         .topbar .print-btn { background:#0d2b5b; color:white; border-color: #0d2b5b; }
//         .print-area { padding: 12mm; box-sizing: border-box; width:100%; display:flex; justify-content:center; align-items:flex-start; margin-top:60px; }
//         .cert-container { width: 1000px; max-width:100%; box-sizing:border-box; }
//         @media print {
//           .topbar { display: none !important; }
//           .print-area { margin-top: 0; padding: 0; }
//         }
//       </style>
//     `;

//     const script = `
//       <script>
//         function onPrint() {
//           // small delay so layout settles
//           setTimeout(() => window.print(), 120);
//         }
//         function onClose() { window.close(); }
//         // ensure images load; disable print button until images loaded (optional)
//         window.addEventListener('load', function() {
//           try {
//             const btn = document.getElementById('__print_btn__');
//             const imgs = Array.from(document.images);
//             if (!btn) return;
//             if (imgs.length === 0) { btn.disabled = false; return; }
//             let loaded=0;
//             imgs.forEach(img=>{
//               if (img.complete) loaded++;
//               else {
//                 img.addEventListener('load', ()=>{ loaded++; if(loaded===imgs.length) btn.disabled=false; }, {once:true});
//                 img.addEventListener('error', ()=>{ loaded++; if(loaded===imgs.length) btn.disabled=false; }, {once:true});
//               }
//             });
//             if (loaded===imgs.length) btn.disabled=false;
//           } catch(e){}
//         });
//       </script>
//     `;

//     const html = `
//       <html>
//         <head><title>${title}</title>${styles}</head>
//         <body>
//           <div class="topbar">
//             <button onclick="onClose()">Close</button>
//             <button id="__print_btn__" class="print-btn" onclick="onPrint()">Print</button>
//           </div>

//           <div class="print-area">
//             <div class="cert-container">
//               ${innerHTML}
//             </div>
//           </div>

//           ${script}
//         </body>
//       </html>
//     `;

//     const newTab = window.open("", "_blank");
//     if (!newTab) {
//       alert("Popup blocked. Allow popups for this site to open certificate.");
//       return;
//     }
//     newTab.document.open();
//     newTab.document.write(html);
//     newTab.document.close();
//     newTab.focus();
//   };

//   const openCertificateInNewTabFromName = async (
//     certName,
//     createdAt = null
//   ) => {
//     setHiddenCert({ name: certName, created_at: createdAt });
//   };

//   // state to keep hidden cert to render for grabbing markup
//   const [hiddenCert, setHiddenCert] = useState(null);

//   useEffect(() => {
//     let cancelled = false;
//     const run = async () => {
//       if (!hiddenCert) return;
//       await new Promise((r) => setTimeout(r, 150));
//       const node = hiddenRef.current;
//       if (!node) return;
//       // wait for images inside node
//       await waitForImages(node, 2500);
//       if (cancelled) return;
//       const inner = node.innerHTML;
//       // open new tab
//       await openNewTabWithContent(inner, `Certificate - ${hiddenCert.name}`);
//       // cleanup hidden render after small delay (so user can still copy if needed)
//       setTimeout(() => setHiddenCert(null), 300);
//     };
//     run();
//     return () => {
//       cancelled = true;
//     };
//   }, [hiddenCert]);

//   // Generate and open immediately
//   const handleGenerate = async (e) => {
//     e?.preventDefault?.();
//     setError("");
//     const trimmed = (name ?? "").trim();
//     if (!trimmed) {
//       setError("Name is required");
//       return;
//     }
//     try {
//       setGenerating(true);
//       const res = await axios.post(
//         API.POST,
//         { name: trimmed },
//         { headers: { "Content-Type": "application/json" } }
//       );
//       const insertId = res?.data?.data?.insertId ?? null;
//       if (insertId) {
//         // fetch saved record and open by id
//         await handleView(insertId);
//       } else {
//         const created_at = new Date().toISOString();
//         // render hidden certificate and open tab via effect
//         await openCertificateInNewTabFromName(trimmed, created_at);
//         setInfo("Opened preview (not persisted).");
//       }
//       await fetchList();
//     } catch (err) {
//       console.error("Generate error:", err);
//       setError(err?.response?.data?.error || "Server error while saving");
//     } finally {
//       setGenerating(false);
//       setTimeout(() => setInfo(""), 3000);
//     }
//   };

//   // View by id: fetch and then open new tab
//   const handleView = async (id) => {
//     if (!id) return;
//     setProcessing(true);
//     setError("");
//     try {
//       const res = await axios.get(API.GET_BY_ID(id));
//       const cert = res.data?.data ?? null;
//       if (!cert) throw new Error("No certificate data");
//       await openCertificateInNewTabFromName(cert.name, cert.created_at);
//     } catch (err) {
//       console.error("View error:", err);
//       setError(err?.response?.data?.error || "Unable to fetch certificate");
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const toggleStatus = async (id, currentStatus) => {
//     if (!id) return;
//     const newStatus = currentStatus === "active" ? "inactive" : "active";
//     if (!window.confirm(`Set status to "${newStatus}"?`)) return;
//     try {
//       setProcessing(true);
//       await axios.put(
//         API.UPDATE_STATUS(id),
//         { status: newStatus },
//         { headers: { "Content-Type": "application/json" } }
//       );
//       setInfo("Status updated");
//       await fetchList();
//     } catch (err) {
//       console.error(err);
//       setError(err?.response?.data?.error || "Unable to update status");
//     } finally {
//       setProcessing(false);
//       setTimeout(() => setInfo(""), 2500);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!id) return;
//     if (!window.confirm("Delete this certificate?")) return;
//     try {
//       setProcessing(true);
//       await axios.delete(API.DELETE(id));
//       setInfo("Deleted");
//       await fetchList();
//     } catch (err) {
//       console.error(err);
//       setError(err?.response?.data?.error || "Unable to delete");
//     } finally {
//       setProcessing(false);
//       setTimeout(() => setInfo(""), 2500);
//     }
//   };

//   const formatDate = (d) => {
//     if (!d) return "-";
//     const dt = new Date(d);
//     return dt.toLocaleString("en-IN", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   return (
//     <div className="min-h-screen p-6 bg-gray-50">
//       <div className="max-w-[1100px] mx-auto">
//         <div className="bg-white rounded shadow p-4 mb-4">
//           <h2 className="text-lg font-semibold text-[#0d2b5b]">
//             Generate Certificate
//           </h2>
//           <form
//             onSubmit={(e) => {
//               e.preventDefault();
//               handleGenerate();
//             }}
//             className="mt-3 flex gap-3"
//           >
//             <input
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder="Enter member name"
//               className="flex-1 px-3 py-2 border rounded"
//               disabled={generating || processing}
//             />
//             <button
//               type="submit"
//               className="px-4 py-2 bg-[#0d2b5b] text-white rounded"
//               disabled={generating || processing}
//             >
//               {generating ? "Saving..." : "Generate & Open"}
//             </button>
//             <button
//               type="button"
//               onClick={() => setName(currentUser?.name ?? "")}
//               className="px-3 py-2 border rounded"
//             >
//               Use profile name
//             </button>
//           </form>
//           <div className="mt-2 text-sm text-red-600">{error}</div>
//           <div className="mt-1 text-sm text-green-600">{info}</div>
//         </div>

//         {/* List */}
//         <div className="bg-white rounded shadow p-4">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="font-semibold text-[#0d2b5b]">
//               Certificates ({list.length})
//             </h3>
//             <button
//               onClick={fetchList}
//               className="px-2 py-1 border rounded"
//               disabled={loadingList}
//             >
//               {loadingList ? "Loading..." : "Refresh"}
//             </button>
//           </div>

//           <div className="overflow-auto border rounded max-h-[520px]">
//             <table className="w-full min-w-[640px]">
//               <thead className="bg-gray-100 sticky top-0">
//                 <tr>
//                   <th className="text-left p-2 text-xs">#</th>
//                   <th className="text-left p-2 text-xs">Name</th>
//                   <th className="text-left p-2 text-xs">Date</th>
//                   <th className="text-left p-2 text-xs">Status</th>
//                   <th className="text-left p-2 text-xs">Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {list.length === 0 ? (
//                   <tr>
//                     <td colSpan={5} className="p-4 text-gray-600">
//                       No certificates
//                     </td>
//                   </tr>
//                 ) : (
//                   list.map((c, idx) => (
//                     <tr key={c.id} className="hover:bg-gray-50">
//                       <td className="p-2 text-sm">{idx + 1}</td>
//                       <td className="p-2 text-sm">{c.name}</td>
//                       <td className="p-2 text-sm">
//                         {formatDate(c.created_at)}
//                       </td>
//                       <td className="p-2 text-sm">{c.status ?? "inactive"}</td>
//                       <td className="p-2 text-sm">
//                         <div className="flex gap-2">
//                           <button
//                             onClick={() => toggleStatus(c.id, c.status)}
//                             className="px-2 py-1 border rounded text-xs"
//                             disabled={processing}
//                           >
//                             Toggle Status
//                           </button>
//                           <button
//                             onClick={() => handleView(c.id)}
//                             className="px-2 py-1 border rounded text-xs"
//                             disabled={processing}
//                           >
//                             Open
//                           </button>
//                           <button
//                             onClick={() => handleDelete(c.id)}
//                             className="px-2 py-1 border rounded text-xs text-red-600"
//                             disabled={processing}
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       <div
//         aria-hidden="true"
//         style={{
//           position: "fixed",
//           left: -10000,
//           top: 0,
//           width: 0,
//           height: 0,
//           overflow: "hidden",
//         }}
//       >
//         <div ref={hiddenRef}>
//           {hiddenCert && (
//             <div className="w-full max-w-[1200px]">
//               <Certificate
//                 name={hiddenCert.name}
//                 presidentName={presidentName}
//                 viceName={viceName}
//                 logo={logo}
//               />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
