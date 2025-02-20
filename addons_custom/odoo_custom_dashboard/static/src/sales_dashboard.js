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
            from_date: this.props.from_date || '2024-01-01',
            to_date: this.props.to_date || today,
            quotations: {
                value: 0,
                percentage: 0,
            },
            orders: {
                value: 0,
                percentage: 0,
                revenue: "$0",
                revenue_percentage: 0,
                average: "$0",
                average_percentage: 0,
            },

            partners: [],  // Lưu danh sách partner
            selected_partners: [],  // Đối tác đã chọn
        });
        console.log("📌 Current state:", this.state);


        // Load external JS for Chart.js
        onWillStart(async () => {
            await loadJS("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js");
            console.log("📌 Before fetching data, state:", this.state); // Debug
            await this.getPartners();
            await this.getQuotations();
            await this.getOrders();
        });

        useEffect(() => {
            this.updateChart();
        }, () => [this.state.datasets, this.state.labels]);

        onMounted(() => {
            this.loadOrderData();
        });
        onWillUnmount(() => {
            if (this.chart) {
                this.chart.destroy();
            }
        });

    }

    // Handle changes in date inputs
    async onChangeDate(ev) {
        await this.getOrders();
        await this.getQuotations();
        await this.loadOrderData();
        const field = ev.target.id;
        const value = ev.target.value;

        console.log(`📅 Date changed: ${field} -> ${value}`);

        this.state[field] = value;
    }

    async onChangePartner(ev) {
        const selectedOptions = Array.from(ev.target.selectedOptions); // Lấy tất cả các option được chọn  
        const selectedValues = selectedOptions.map(option => option.value); // Giá trị đã chọn  

        if (selectedValues.includes("all")) {
            // Nếu "Xem Tất Cả" được chọn, hủy tất cả các lựa chọn khác  
            this.state.selected_partners = this.state.partners.map(partner => partner.id); // Lấy tất cả các partner  
            console.log("📦 All partners selected");
        } else {
            // Nếu không chọn "Xem Tất Cả", lấy các đối tác đã chọn  
            this.state.selected_partners = selectedValues
                .filter(value => value !== "all") // Lọc bỏ tùy chọn "Xem Tất Cả"  
                .map(value => parseInt(value)); // Chuyển đổi thành số nguyên  
            console.log("📦 Selected partners after change:", this.state.selected_partners);
        }

        // Gọi lại các hàm để tải lại dữ liệu  
        await this.getOrders();
        await this.getQuotations();
        await this.loadOrderData();
    }
    // 

    async getPartners() {
        try {
            console.log("🔍 Fetching partners with orders or quotations...");

            // Lấy danh sách đơn hàng (orders)  
            const orders = await this.orm.searchRead("sale.order", [["state", "in", ["sale", "done"]]], ["partner_id"]);
            const orderPartnerIds = orders.map(order => order.partner_id[0]); // Lấy id partner từ đơn hàng  

            // Lấy danh sách báo giá (quotations)  
            const quotations = await this.orm.searchRead("sale.order", [["state", "in", ["sent", "draft"]]], ["partner_id"]);
            const quotationPartnerIds = quotations.map(quotation => quotation.partner_id[0]); // Lấy id partner từ báo giá  

            // Kết hợp các partner_id từ đơn hàng và báo giá  
            const allPartnerIds = [...new Set([...orderPartnerIds, ...quotationPartnerIds])];

            // Tìm thông tin partner từ partner_ids  
            const partners = await this.orm.searchRead("res.partner", [["id", "in", allPartnerIds]], ["id", "name"]);

            // Cập nhật state  
            this.state.partners = partners;
            console.log("✅ Partners loaded:", partners);
        } catch (error) {
            console.error("❌ Error fetching partners:", error);
        }
    }


    // Fetch order data from Odoo based on selected date range
    async loadOrderData() {
        let order_domain = [['state', 'in', ['sale', 'done']]];
        let quotation_domain = [['state', 'in', ['sent', 'draft']]];

        if (this.state.selected_partners.length > 0) {
            console.log("🔍 Selected partners:", this.state.selected_partners);
            order_domain.push(['partner_id', 'in', this.state.selected_partners]);
            quotation_domain.push(['partner_id', 'in', this.state.selected_partners]);
        }
        if (this.state.from_date) {
            order_domain.push(['date_order', '>=', this.state.from_date]);
            quotation_domain.push(['date_order', '>=', this.state.from_date]);
        }
        if (this.state.to_date) {
            order_domain.push(['date_order', '<=', this.state.to_date]);
            quotation_domain.push(['date_order', '<=', this.state.to_date]);
        }

        try {
            console.log("🔍 Fetching data with domain:", order_domain, quotation_domain);

            const ordersData = await this.orm.searchRead("sale.order", order_domain, ["date_order", "amount_total"]);
            const quotationsData = await this.orm.searchRead("sale.order", quotation_domain, ["date_order", "amount_total"]);
            console.log("✅ Orders data loaded:", ordersData);
            console.log("✅ Quotations data loaded:", quotationsData);
            const orderLabels = ordersData.map(order => new Date(order.date_order).toLocaleDateString("en-GB"));
            const quotationLabels = quotationsData.map(quotation => new Date(quotation.date_order).toLocaleDateString("en-GB"));


            this.state.labels = [...new Set([...orderLabels, ...quotationLabels])]; // Loại bỏ trùng lặp

            // Chuẩn bị datasets cho biểu đồ
            // Tính tổng cho mỗi ngày và tạo datasets  
            this.state.datasets = [
                {
                    label: 'Orders',
                    data: this.state.labels.map(date => {
                        // Tính tổng amount_total cho đơn hàng trong ngày này  
                        const totalOrders = ordersData
                            .filter(o => new Date(o.date_order).toLocaleDateString("en-GB") === date)
                            .reduce((sum, order) => sum + order.amount_total, 0); // Sử dụng reduce để tính tổng  
                        return totalOrders;
                    }),
                    backgroundColor: '#CDB4DB',
                    borderColor: '#765378',
                    borderWidth: 2
                },
                {
                    label: 'Quotations',
                    data: this.state.labels.map(date => {
                        // Tính tổng amount_total cho báo giá trong ngày này  
                        const totalQuotations = quotationsData
                            .filter(q => new Date(q.date_order).toLocaleDateString("en-GB") === date)
                            .reduce((sum, quotation) => sum + quotation.amount_total, 0); // Sử dụng reduce để tính tổng  
                        return totalQuotations;
                    }),
                    backgroundColor: '#dc3545',
                    borderColor: '#FF577F',
                    borderWidth: 2
                }
            ];

            // Cập nhật biểu đồ  
            this.updateChart();



            // Cập nhật biểu đồ
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

    async getQuotations() {
        let domain = [['state', 'in', ['sent', 'draft']]]

        // Kiểm tra và thêm điều kiện cho from_date và to_date
        if (this.state.selected_partners.length > 0) {
            domain.push(['partner_id', 'in', this.state.selected_partners])
        }
        if (this.state.from_date) {
            domain.push(['date_order', '>=', this.state.from_date])
        };
        if (this.state.to_date) {
            domain.push(['date_order', '<=', this.state.to_date])
        };


        const data = await this.orm.searchCount("sale.order", domain)
        this.state.quotations.value = data;

        // Dữ liệu cho khoảng thời gian trước đó
        let prev_domain = [['state', 'in', ['sent', 'draft']]]
        if (this.state.selected_partners.length > 0) {
            prev_domain.push(['partner_id', 'in', this.state.selected_partners])
        }

        if (this.state.from_date) {
            prev_domain.push(['date_order', '>=', this.state.previous_date])
        };
        if (this.state.to_date) {
            prev_domain.push(['date_order', '<=', this.state.to_date])
        };


        const prev_data = await this.orm.searchCount("sale.order", prev_domain)
        const percentage = (prev_data !== 0) ? ((data - prev_data) / prev_data) * 100 : 0
        this.state.quotations.percentage = percentage.toFixed(2);
    }


    async getOrders() {
        let domain = [['state', 'in', ['sale', 'done']]]

        // Kiểm tra và thêm điều kiện cho from_date và to_date
        if (this.state.selected_partners.length > 0) {
            domain.push(['partner_id', 'in', this.state.selected_partners])
        }
        if (this.state.from_date) {
            domain.push(['date_order', '>=', this.state.from_date])
        };
        if (this.state.to_date) {
            domain.push(['date_order', '<=', this.state.to_date])
        };

        try {
            const data = await this.orm.searchCount("sale.order", domain);

            let prev_domain = [['state', 'in', ['sale', 'done']]];

            if (this.state.selected_partners.length > 0) {
                prev_domain.push(['partner_id', 'in', this.state.selected_partners]);
            }
            if (this.state.from_date) {
                prev_domain.push(['date_order', '>=', this.state.previous_date]);
            }
            if (this.state.to_date) {
                prev_domain.push(['date_order', '<=', this.state.to_date]);
            }


            const prev_data = await this.orm.searchCount("sale.order", prev_domain);
            const percentage = prev_data !== 0 ? ((data - prev_data) / prev_data) * 100 : 0;

            // Tính doanh thu và trung bình
            const [current_revenue] = await this.orm.readGroup("sale.order", domain, ["amount_total:sum"], []);
            const [prev_revenue] = await this.orm.readGroup("sale.order", prev_domain, ["amount_total:sum"], []);

            const revenue_percentage = prev_revenue.amount_total !== 0
                ? ((current_revenue.amount_total - prev_revenue.amount_total) / prev_revenue.amount_total) * 100
                : 0;

            const [current_average] = await this.orm.readGroup("sale.order", domain, ["amount_total:avg"], []);
            const [prev_average] = await this.orm.readGroup("sale.order", prev_domain, ["amount_total:avg"], []);

            const average_percentage = prev_average.amount_total !== 0
                ? ((current_average.amount_total - prev_average.amount_total) / prev_average.amount_total) * 100
                : 0;

            // ✅ Cập nhật state ĐÚNG CÁCH
            Object.assign(this.state.orders, {
                value: data,
                percentage: percentage.toFixed(2),
                revenue: `$${(current_revenue.amount_total / 1000).toFixed(2)}K`,
                revenue_percentage: revenue_percentage.toFixed(2),
                average: `$${(current_average.amount_total / 1000).toFixed(2)}K`,
                average_percentage: average_percentage.toFixed(2),
            });

            console.log("✅ Orders updated:", this.state.orders);

        } catch (error) {
            console.error("❌ Error in getOrders:", error);
        }
    }

    async viewOrders() {
        let domain = [['state', 'in', ['sale', 'done']]];

        if (this.state.selected_partners.length > 0) {
            domain.push(['partner_id', 'in', this.state.selected_partners]);
        }
        if (this.state.from_date) {
            domain.push(['date_order', '>=', this.state.from_date]);
        }
        if (this.state.to_date) {
            domain.push(['date_order', '<=', this.state.to_date]);
        }


        if (this.actionService) {
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: "sale.order",
                views: [[false, "list"], [false, "form"]],
                domain: domain,
                name: "Sales Orders",
            });
        } else {
            console.error("Action service is not defined");
        }
    }


    async viewQuotations() {
        let domain = [['state', 'in', ['sent', 'draft']]]


        if (this.state.selected_partners.length > 0) {
            domain.push(['partner_id', 'in', this.state.selected_partners])
        }
        if (this.state.from_date) {
            domain.push(['date_order', '>=', this.state.from_date])
        }
        if (this.state.to_date) {
            domain.push(['date_order', '<=', this.state.to_date])
        }


        if (this.actionService) {
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: "sale.order",
                views: [[false, "list"], [false, "form"]],
                domain: domain,
                name: "Quotations",
            })
        } else {
            console.error("Action service is not defined")
        }
    }
    viewRevenues() {
        let domain = [['state', 'in', ['sale', 'done']]]

        if (this.state.selected_partners.length > 0) {
            domain.push(['partner_id', 'in', this.state.selected_partners])
        }
        if (this.state.from_date) {
            domain.push(['date_order', '>=', this.state.from_date])
        }
        if (this.state.to_date) {
            domain.push(['date_order', '<=', this.state.to_date])
        }


        if (this.actionService) {
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: "sale.order",
                views: [[false, "pivot"], [false, "form"]],
                domain: domain,
                name: "Revenues",
            })
        } else {
            console.error("Action service is not defined")
        }
    }
    viewAverages() {
        let domain = [['state', 'in', ['sale', 'done']]]

        if (this.state.selected_partners.length > 0) {
            domain.push(['partner_id', 'in', this.state.selected_partners])
        }
        if (this.state.from_date) {
            domain.push(['date_order', '>=', this.state.from_date])
        }
        if (this.state.to_date) {
            domain.push(['date_order', '<=', this.state.to_date])
        }



        if (this.actionService) {
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: "sale.order",
                views: [[false, "pivot"], [false, "form"]],
                domain: domain,
                name: "Averages",
            })
        } else {
            console.error("Action service is not defined")
        }
    }
}

// Assign a template to the component
OwlSalesDashboard.template = "owl.OwlSalesDashboard";


// OwlSalesDashboard.template = "owl.OwlSalesDashboard";

registry.category("actions").add("owl.sales_dashboard", OwlSalesDashboard);