/** @odoo-module */

// import { registry } from "@web/core/registry"
// import { KpiCard } from "./kpi_card/kpi_card"
// import { ChartRenderer } from "./chart_renderer/chart_renderer"
// import { loadJS } from "@web/core/assets"
// import { useService } from "@web/core/utils/hooks"
// const { Component, onWillStart, useRef, onMounted, useState } = owl

// export class OwlSalesDashboard extends Component {
//     setup(){
//         this.chartRef = useRef("chart");
//         super.setup();
//         this.state = useState({
//             quotations: {
//                 value: 10,
//                 percentage: 6,
//             },
//             period: 90,
//             from_date: null, // Thêm trường from_date
//             to_date: null, // Thêm trường to_date
//         });
//         this.orm = useService("orm");
//         this.actionService = useService('action');

//         onWillStart(async () => {
//             await this.getQuotations()
//             await this.getOrders()
//         })
//     }

//     async onChangeDate(){
//         // Gọi lại khi có thay đổi ngày
//         await this.getQuotations()
//         await this.getOrders()
//         // await this.renderChart()
//     }

//     async getQuotations(){
//     let domain = [['state', 'in', ['sent', 'draft']]]

//     // Kiểm tra và thêm điều kiện cho from_date và to_date
//     if (this.state.from_date) {
//         domain.push(['date_order', '>=', this.state.from_date])
//     };
//     if (this.state.to_date) {
//         domain.push(['date_order', '<=', this.state.to_date])
//     };

//     const data = await this.orm.searchCount("sale.order", domain)
//     this.state.quotations.value = data;

//     // Dữ liệu cho khoảng thời gian trước đó
//     let prev_domain = [['state', 'in', ['sent', 'draft']]]

//     if (this.state.from_date) {
//         prev_domain.push(['date_order', '>=', this.state.previous_date])
//     };
//     if (this.state.to_date) {
//         prev_domain.push(['date_order', '<=', this.state.to_date])
//     };

//     const prev_data = await this.orm.searchCount("sale.order", prev_domain)
//     const percentage = (prev_data !== 0) ? ((data - prev_data) / prev_data) * 100 : 0
//     this.state.quotations.percentage = percentage.toFixed(2);
//     }


//     async getOrders(){
//         let domain = [['state', 'in', ['sale', 'done']]]

//         // Kiểm tra và thêm điều kiện cho from_date và to_date
//         if (this.state.from_date) {
//             domain.push(['date_order', '>=', this.state.from_date])
//         };
//         if (this.state.to_date) {
//             domain.push(['date_order', '<=', this.state.to_date])
//         };

//         const data = await this.orm.searchCount("sale.order", domain)

//         // Khoảng thời gian trước đó
//         let prev_domain = [['state', 'in', ['sale', 'done']]]

//         if (this.state.from_date) {
//             prev_domain.push(['date_order', '>=', this.state.previous_date])
//         };
//         if (this.state.to_date) {
//             prev_domain.push(['date_order', '<=', this.state.to_date])
//         };

//         const prev_data = await this.orm.searchCount("sale.order", prev_domain)
//         const percentage = (prev_data !== 0) ? ((data - prev_data) / prev_data) * 100 : 0

//         // Tính doanh thu và trung bình
//         const current_revenue = await this.orm.readGroup("sale.order", domain, ["amount_total:sum"], [])
//         const prev_revenue = await this.orm.readGroup("sale.order", prev_domain, ["amount_total:sum"], [])
//         const revenue_percentage = (prev_revenue[0].amount_total !== 0) ? ((current_revenue[0].amount_total - prev_revenue[0].amount_total) / prev_revenue[0].amount_total) * 100 : 0

//         const current_average = await this.orm.readGroup("sale.order", domain, ["amount_total:avg"], [])
//         const prev_average = await this.orm.readGroup("sale.order", prev_domain, ["amount_total:avg"], [])
//         const average_percentage = (prev_average[0].amount_total !== 0) ? ((current_average[0].amount_total - prev_average[0].amount_total) / prev_average[0].amount_total) * 100 : 0

//         this.state.orders = {
//             value: data,
//             percentage: percentage.toFixed(2),
//             revenue: `$${(current_revenue[0].amount_total / 1000).toFixed(2)}K`,
//             revenue_percentage: revenue_percentage.toFixed(2),
//             average: `$${(current_average[0].amount_total / 1000).toFixed(2)}K`,
//             average_percentage: average_percentage.toFixed(2),
//         };
//     }

//     async viewOrders() {  
//         let domain = [['state', 'in', ['sale', 'done']]];  
      
//         if (this.state.from_date) {  
//             domain.push(['date_order', '>=', this.state.from_date]);  
//         }  
//         if (this.state.to_date) {  
//             domain.push(['date_order', '<=', this.state.to_date]);  
//         }  
      
//         if (this.actionService) {  
//             this.actionService.doAction({  
//                 type: "ir.actions.act_window",  
//                 res_model: "sale.order",  
//                 views: [[false, "list"], [false, "form"]],  
//                 domain: domain,  
//                 name: "Sales Orders",  
//             });  
//         } else {  
//             console.error("Action service is not defined");  
//         }  
//     }  
    

//     async viewQuotations(){
//         let domain = [['state', 'in', ['sent', 'draft']]]

//         if (this.state.from_date) {
//             domain.push(['date_order', '>=', this.state.from_date])
//         }
//         if (this.state.to_date) {
//             domain.push(['date_order', '<=', this.state.to_date])
//         }

//         if (this.actionService) {
//             this.actionService.doAction({
//                 type: "ir.actions.act_window",
//                 res_model: "sale.order",
//                 views: [[false, "list"], [false, "form"]],
//                 domain: domain,
//                 name: "Quotations",
//             })
//         } else {
//             console.error("Action service is not defined")
//         }
//     }
//     viewRevenues(){
//         let domain = [['state', 'in', ['sale', 'done']]]
//         if (this.state.from_date) {
//             domain.push(['date_order', '>=', this.state.from_date])
//         }
//         if (this.state.to_date) {
//             domain.push(['date_order', '<=', this.state.to_date])
//         }

//         if (this.actionService) {
//             this.actionService.doAction({
//                 type: "ir.actions.act_window",
//                 res_model: "sale.order",
//                 views: [[false, "pivot"], [false, "form"]],
//                 domain: domain,
//                 name: "Revenues",
//             })
//         } else {
//             console.error("Action service is not defined")
//         }
//     }
//     viewAverages(){
//         let domain = [['state', 'in', ['sale', 'done']]]
//         if (this.state.from_date) {
//             domain.push(['date_order', '>=', this.state.from_date])
//         }
//         if (this.state.to_date) {
//             domain.push(['date_order', '<=', this.state.to_date])
//         }

//         if (this.actionService) {
//             this.actionService.doAction({
//                 type: "ir.actions.act_window",
//                 res_model: "sale.order",
//                 views: [[false, "pivot"], [false, "form"]],
//                 domain: domain,
//                 name: "Averages",
//             })
//         } else {
//             console.error("Action service is not defined")
//         }
//     }

// }

// OwlSalesDashboard.template = "owl.OwlSalesDashboard"
// OwlSalesDashboard.components = { KpiCard, ChartRenderer }

// registry.category("actions").add("owl.sales_dashboard", OwlSalesDashboard)


import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";
const { Component, onWillStart, onWillUnmount, onMounted, useRef, useState, useEffect } = owl;

export class OwlSalesDashboard extends Component {
    setup() {
        // Refs and services setup
        this.chartRef = useRef("chart");
        this.actionService = useService("action");
        this.orm = useService("orm");

        // Default date set to today
        const today = new Date().toISOString().split("T")[0];

        // Initial state
        this.state = useState({
            datasets: [],
            labels: [],
            from_date: this.props.from_date || today,
            to_date: this.props.to_date || today,
        });

        // Load external JS for Chart.js
        onWillStart(async () => {
            await loadJS("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js");
        });

        // Effect hook to update chart when datasets or labels change
        useEffect(() => {
            this.updateChart();
        }, () => [this.state.datasets, this.state.labels]);

        // Load initial order data
        onMounted(() => {
            this.loadOrderData();
        });

        // Cleanup chart instance when component unmounts
        onWillUnmount(() => {
            if (this.chart) {
                this.chart.destroy();
            }
        });
    }

    // Handle changes in date inputs
    async onChangeDate(ev) {
        const field = ev.target.id;
        const value = ev.target.value;

        console.log(`📅 Date changed: ${field} -> ${value}`);

        // Update state with new date values
        this.state[field] = value;

        // Reload order data after date change
        await this.loadOrderData();
    }

    // Fetch order data from Odoo based on selected date range
    async loadOrderData() {
        let domain = [['state', 'in', ['sale', 'done']]];

        if (this.state.from_date) {
            domain.push(['date_order', '>=', this.state.from_date]);
        }
        if (this.state.to_date) {
            domain.push(['date_order', '<=', this.state.to_date]);
        }

        try {
            console.log("🔍 Fetching data with domain:", domain);

            const ordersData = await this.orm.searchRead("sale.order", domain, ["date_order", "amount_total"]);

            if (ordersData.length > 0) {
                // Format date to a readable format
                this.state.labels = ordersData.map(order => new Date(order.date_order).toLocaleDateString("en-GB"));
                this.state.datasets = [{
                    label: 'Orders Revenue',
                    data: ordersData.map(order => order.amount_total),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }];
            } else {
                this.state.labels = [];
                this.state.datasets = [];
            }

            // Update the chart after fetching data
            this.updateChart();

        } catch (error) {
            console.error("❌ Error fetching data from Odoo:", error);
        }
    }

    // Update chart with new data
    updateChart() {
        console.log("📊 Updating chart with data:", this.state.labels, this.state.datasets);

        if (this.chart) {
            this.chart.destroy();
        }

        if (this.chartRef.el) {
            if (this.state.datasets.length > 0) {
                this.chart = new Chart(this.chartRef.el, {
                    type: this.props.type || 'bar',
                    data: {
                        labels: this.state.labels,
                        datasets: this.state.datasets
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' },
                            title: { display: true, text: this.props.title || 'Sales Report', position: 'bottom' }
                        },
                        scales: { y: { beginAtZero: true } }
                    },
                });
            } else {
                console.warn("⚠️ No data available to display chart.");
                this.chartRef.el.innerHTML = '<p style="text-align: center; font-weight: bold;">No data available</p>';
            }
        }
    }
}

// Assign a template to the component
OwlSalesDashboard.template = "owl.OwlSalesDashboard";


// OwlSalesDashboard.template = "owl.OwlSalesDashboard";

registry.category("actions").add("owl.sales_dashboard", OwlSalesDashboard);


