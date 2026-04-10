document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
        alert('Access Denied. Admins only.');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('adminName').innerText = `Admin: ${localStorage.getItem('username')}`;

    try {
        // Load Metrics
        const metricsRes = await fetch('/api/admin/metrics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const metrics = await metricsRes.json();
        
        document.getElementById('m-users').innerText = metrics.totalUsers || 0;
        document.getElementById('m-bookings').innerText = metrics.totalBookings || 0;
        document.getElementById('m-revenue').innerText = `₹${metrics.totalRevenue || 0}`;

        // Load Graph Data
        const graphRes = await fetch('/api/admin/graph', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const graphData = await graphRes.json(); // { elements: [...] }

        // Initialize Cytoscape
        const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: graphData.elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'text-valign': 'center',
                        'color': '#fff',
                        'text-outline-width': 2,
                        'text-outline-color': '#888',
                        'font-size': '12px'
                    }
                },
                {
                    selector: 'node[type="User"]',
                    style: {
                        'background-color': '#0c727c',
                        'width': '40px',
                        'height': '40px'
                    }
                },
                {
                    selector: 'node[type="Product"]',
                    style: {
                        'background-color': '#ffae42',
                        'shape': 'round-rectangle',
                        'width': '60px',
                        'height': '30px'
                    }
                },
                {
                    selector: 'node[type="Review"]',
                    style: {
                        'background-color': '#e85d04',
                        'shape': 'star',
                        'width': '30px',
                        'height': '30px'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'font-size': '8px',
                        'text-rotation': 'autorotate',
                        'text-background-opacity': 1,
                        'text-background-color': '#fff',
                        'text-background-padding': '2px'
                    }
                },
                {
                    selector: 'edge[label="CONNECTED_TO"]',
                    style: {
                        'line-color': '#2a9d8f',
                        'line-style': 'dashed',
                        'width': 3
                    }
                }
            ],
            layout: {
                name: 'cose',
                idealEdgeLength: 100,
                nodeOverlap: 20,
                refresh: 20,
                fit: true,
                padding: 30,
                randomize: false,
                componentSpacing: 100,
                nodeRepulsion: 400000,
                edgeElasticity: 100,
                nestingFactor: 5,
                gravity: 80,
                numIter: 1000,
                initialTemp: 200,
                coolingFactor: 0.95,
                minTemp: 1.0
            }
        });
        
    } catch (e) {
        console.error('Error loading admin data', e);
    }

    document.getElementById('deleteUserBtn').addEventListener('click', async () => {
        const username = document.getElementById('deleteUsername').value.trim();
        if (!username) return alert('Enter a username first.');
        if (!confirm(`Are you absolutely sure you want to delete ${username} and all their records?`)) return;

        try {
            const res = await fetch(`/api/admin/users/${username}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok) {
                alert(data.message);
                document.getElementById('deleteUsername').value = '';
                location.reload(); // Reload to refresh metrics and graph
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (e) {
            alert('Failed to connect to server.');
        }
    });

});
