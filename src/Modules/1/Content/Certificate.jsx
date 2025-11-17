import React, { useRef } from "react";
import { useSelector } from "react-redux";
import logoImg from "./../../../assets/Apple 250.png";

export default function Certificate({
  presidentName = "Keerti Sharma",
  viceName = "Pradeep Ingalkar",
  logo = logoImg,
}) {
  const currentUser = useSelector((state) => state.user.currentUser);
  const printRef = useRef();

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${currentUser?.name || "User"}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
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
            .corner.top-left {
              top: 0; left: 0;
              clip-path: polygon(0 0, 100% 0, 0 100%);
            }
            .corner.bottom-right {
              bottom: 0; right: 0;
              clip-path: polygon(100% 100%, 0 100%, 100% 0);
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 20px;
              margin-bottom: 20px;
            }
            .logo {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              background: #fff;
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: inset 0 0 8px rgba(0,0,0,0.1);
            }
            .header-text {
              text-align: left;
              color: #0d2b5b;
            }
            .header-text h1 {
              font-size: 34px;
              margin: 0;
              font-weight: 800;
            }
            .header-text h2 {
              font-size: 26px;
              margin: -5px 0 0 0;
              font-weight: 600;
            }
            .title {
              text-align: center;
              color: #0d2b5b;
              font-size: 40px;
              font-weight: 800;
              margin-top: 30px;
              line-height: 1.1;
            }
            .subtitle {
              text-align: center;
              color: #0d2b5b;
              font-size: 16px;
              margin-top: 10px;
            }
            .recipient {
              text-align: center;
              margin-top: 25px;
              color: #0d2b5b;
            }
            .recipient-name {
              font-size: 42px;
              font-weight: 700;
              margin-top: 10px;
            }
            hr {
              width: 65%;
              margin: 30px auto;
              border: none;
              border-top: 1px solid #ccc;
            }
            .description {
              text-align: center;
              color: #0d2b5b;
              font-size: 17px;
              line-height: 1.4;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              padding: 0 30px;
            }
            .sign-block {
              text-align: center;
              color: #0d2b5b;
            }
            .sign-block .name {
              font-weight: 600;
              font-size: 18px;
            }
            .sign-block .role {
              font-size: 14px;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gray-50">
      {/* 🔘 Print Button */}
      <button
        onClick={handlePrint}
        className="absolute top-5 right-5 bg-[#805dca] hover:bg-[#6c49b4] text-white font-semibold px-5 py-2 rounded-lg shadow-md print:hidden"
      >
        Print Certificate
      </button>

      {/* 📜 Certificate */}
      <div ref={printRef} className="certificate relative text-[#0d2b5b]">
        {/* Decorative Corners */}
        <div className="corner top-left"></div>
        <div className="corner bottom-right"></div>

        {/* Header */}
        <div className="header">
          <div className="logo">
            <img
              src={logo}
              alt="Logo"
              style={{ width: "80%", height: "80%", objectFit: "contain" }}
            />
          </div>
          <div className="header-text">
            <h1>Future Kids</h1>
            <h2>Foundation</h2>
          </div>
        </div>

        {/* Main Title */}
        <div className="title">
          CERTIFICATE OF
          <br />
          APPRECIATION
        </div>

        {/* Subtitle */}
        <div className="subtitle">This certificate is proudly presented to</div>

        {/* Recipient Name */}
        <div className="recipient">
          <div className="recipient-name">
            {currentUser?.name || "Recipient"}
          </div>
        </div>

        <hr />

        {/* Description */}
        <div className="description">
          for outstanding participation and contribution
          <br />
          in various foundation activities.
        </div>

        {/* Signatures */}
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
  );
}

//   return (
//     <div className="min-h-screen bg-[#f6b13b] flex items-center justify-center p-6 box-border">
//       <div
//         className="relative w-full max-w-[1200px] rounded-md shadow-2xl overflow-hidden"
//         style={{
//           background:
//             "linear-gradient(180deg,#fffdf7 0%, #fff9ec 60%, #fff7e9 100%)",
//         }}
//       >
//         {/* Decorative Corners */}
//         {/* Top-left corner */}
//         <svg
//           viewBox="0 0 200 200"
//           className="absolute top-0 left-0 w-[200px] h-[200px]"
//           preserveAspectRatio="none"
//         >
//           <path d="M0,0 L200,0 L0,200 Z" fill="#f79e1b" opacity="0.95" />
//           <path d="M0,0 L150,0 L0,150 Z" fill="#ffb845" opacity="0.6" />
//         </svg>

//         {/* Bottom-right corner */}
//         <svg
//           viewBox="0 0 200 200"
//           className="absolute bottom-0 right-0 w-[260px] h-[260px]"
//           preserveAspectRatio="none"
//         >
//           <path d="M200,200 L0,200 L200,0 Z" fill="#f7b33b" opacity="0.95" />
//           <path d="M200,200 L50,200 L200,50 Z" fill="#ffb845" opacity="0.6" />
//         </svg>

//         {/* Inner border */}
//         <div
//           className="absolute inset-0 rounded-md"
//           style={{
//             boxShadow: "inset 0 0 0 10px rgba(247,158,27,0.95)",
//           }}
//         />

//         {/* Content */}
//         <div className="relative z-10 h-full w-full p-6 md:p-10 flex flex-col">
//           {/* --- HEADER: logo + title --- */}
//           <div className="flex flex-col items-center justify-center mt-2 md:mt-4">
//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
//               {/* Logo */}
//               <div className="w-[90px] h-[90px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden flex items-center justify-center bg-white shadow-inner">
//                 {logo ? (
//                   <img
//                     src={logo}
//                     alt="Logo"
//                     className="w-full h-full object-cover"
//                     style={{ objectPosition: "center" }}
//                   />
//                 ) : (
//                   <div
//                     style={{
//                       width: "75%",
//                       height: "75%",
//                       borderRadius: "50%",
//                       background:
//                         "radial-gradient(circle at 30% 30%, #ffd37a 0%, #ffb844 40%, #f79e1b 100%)",
//                     }}
//                   />
//                 )}
//               </div>

//               {/* Text beside logo */}
//               <div className="text-center sm:text-left">
//                 <div
//                   className="font-extrabold text-[#0d2b5b]"
//                   style={{
//                     fontSize: "clamp(24px, 2.6vw, 42px)",
//                     lineHeight: 1,
//                   }}
//                 >
//                   Future Kids
//                 </div>
//                 <div
//                   className="font-semibold text-[#0d2b5b] -mt-1"
//                   style={{
//                     fontSize: "clamp(18px, 1.8vw, 32px)",
//                     lineHeight: 1.2,
//                   }}
//                 >
//                   Foundation
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* --- MAIN TITLE --- */}
//           <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 mt-4 md:mt-6">
//             <div
//               className="text-[#0d2b5b] font-extrabold text-center tracking-tight"
//               style={{ fontSize: "clamp(26px, 4.5vw, 56px)", lineHeight: 1 }}
//             >
//               CERTIFICATE OF
//             </div>
//             <div
//               className="text-[#0d2b5b] font-extrabold text-center tracking-tight"
//               style={{ fontSize: "clamp(26px, 4.5vw, 56px)", lineHeight: 1 }}
//             >
//               APPRECIATION
//             </div>

//             <div className="mt-6 text-center w-full max-w-[820px]">
//               <div
//                 className="text-[#0d2b5b] mb-4 font-medium"
//                 style={{ fontSize: "clamp(12px, 1.25vw, 18px)" }}
//               >
//                 This certificate is proudly presented to
//               </div>

//               <div className="mt-2">
//                 <div
//                   className="text-[#0d2b5b] font-semibold"
//                   style={{ fontSize: "clamp(20px, 3.6vw, 40px)" }}
//                 >
//                   {recipientName}
//                 </div>
//               </div>

//               <hr className="border-t border-[#d6d6d6] my-6 w-3/4 mx-auto" />

//               <p
//                 className="text-[#0d2b5b] mx-auto max-w-[720px]"
//                 style={{ fontSize: "clamp(12px, 1.25vw, 16px)" }}
//               >
//                 for outstanding participation and contribution
//                 <br />
//                 in various foundation activities.
//               </p>
//             </div>
//           </div>

//           {/* --- SIGNATURES --- */}
//           <div className="mt-8 flex flex-col md:flex-row items-center md:items-end justify-between px-2 md:px-8 gap-4">
//             <div className="text-left">
//               <div
//                 className="font-semibold text-[#0d2b5b]"
//                 style={{ fontSize: "clamp(14px, 1.4vw, 18px)" }}
//               >
//                 {presidentName}
//               </div>
//               <div className="text-sm text-[#0d2b5b] opacity-90">President</div>
//             </div>

//             <div className="text-right">
//               <div
//                 className="font-semibold text-[#0d2b5b]"
//                 style={{ fontSize: "clamp(14px, 1.4vw, 18px)" }}
//               >
//                 {viceName}
//               </div>
//               <div className="text-sm text-[#0d2b5b] opacity-90">
//                 Vice President
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
