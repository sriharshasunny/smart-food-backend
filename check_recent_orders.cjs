const supabase = require('./server/utils/supabase');

async function check() {
    console.log("Checking recent orders...");
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching orders:", error);
        return;
    }

    for (const o of orders) {
        console.log(`- ID: ${o.id}, User: ${o.guest_info?.name}, Status: ${o.order_status}, Amount: ${o.total_amount}, Created: ${o.created_at}`);
        const { data: items } = await supabase.from('order_items').select('name, quantity').eq('order_id', o.id);
        console.log(`  Items: ${JSON.stringify(items)}`);
    }
}
check();
