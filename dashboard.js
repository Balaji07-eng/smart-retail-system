const API_BASE = "https://smart-retail-system-sz0s.onrender.com";
let chart;

async function loadSummary(){
  const d = await (await fetch(`${API_BASE}/analytics/summary`)).json();
  totalRevenue.innerText="₹"+d.total_revenue;
  totalProfit.innerText="₹"+d.total_profit;
  totalSales.innerText=d.total_sales;
}

async function loadTrend(type){
  const data = await (await fetch(`${API_BASE}/analytics/trend/${type}`)).json();
  const ctx = document.getElementById("trendChart");

  if(chart) chart.destroy();
  chart = new Chart(ctx,{
    type:"line",
    data:{
      labels:data.map(x=>x.label),
      datasets:[{label:"Revenue",data:data.map(x=>x.value),borderWidth:2}]
    }
  });
}

async function loadPrediction(){
  const d = await (await fetch(`${API_BASE}/analytics/stock-prediction`)).json();
  const t=document.getElementById("predictionTable");
  t.innerHTML="";
  d.forEach(p=>{
    t.innerHTML+=`
      <tr>
        <td>${p.product_id}</td>
        <td>${p.name}</td>
        <td>${p.avg_daily_sales}</td>
        <td>${p.current_stock}</td>
        <td><b>${p.recommended_stock}</b></td>
      </tr>`;
  });
}

window.onload=()=>{
  loadSummary();
  loadTrend("weekly");
  loadPrediction();
};
