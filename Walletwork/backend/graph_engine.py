import networkx as nx
import json
import os

class GraphEngine:
    def __init__(self, scam_db_path="scam_db.json"):
        # Structured scam intelligence database
        self.scam_wallets = {}  # address -> {category, source, confidence, notes}
        self.scam_contracts = {}  # address -> {category, source, confidence, notes}
        self.scam_clusters = {}  # cluster_id -> {addresses, source, confidence, notes}
        self.all_scam_addresses = set()  # Flat set for quick lookup
        self.address_to_cluster = {}  # address -> cluster_id mapping
        
        self.scam_db_path = scam_db_path
        self._load_scam_database()
        self.graph = nx.Graph()

    def _load_scam_database(self):
        """Load structured scam intelligence database with metadata"""
        if not os.path.exists(self.scam_db_path):
            print(f"Warning: {self.scam_db_path} not found. Scam DB is empty.")
            return
            
        try:
            with open(self.scam_db_path, "r") as f:
                scam_data = json.load(f)
            
            # Load wallets
            for entry in scam_data.get("wallets", []):
                addr = entry["address"].lower()
                self.scam_wallets[addr] = {
                    "category": entry.get("category", "unknown"),
                    "source": entry.get("source", "unknown"),
                    "confidence": entry.get("confidence", 0.5),
                    "notes": entry.get("notes", "")
                }
                self.all_scam_addresses.add(addr)
            
            # Load contracts
            for entry in scam_data.get("contracts", []):
                addr = entry["address"].lower()
                self.scam_contracts[addr] = {
                    "category": entry.get("category", "unknown"),
                    "source": entry.get("source", "unknown"),
                    "confidence": entry.get("confidence", 0.5),
                    "notes": entry.get("notes", "")
                }
                self.all_scam_addresses.add(addr)
            
            # Load clusters
            for cluster in scam_data.get("clusters", []):
                cluster_id = cluster.get("cluster_id", "unknown_cluster")
                addresses = [addr.lower() for addr in cluster.get("addresses", [])]
                
                self.scam_clusters[cluster_id] = {
                    "addresses": addresses,
                    "source": cluster.get("source", "unknown"),
                    "confidence": cluster.get("confidence", 0.5),
                    "notes": cluster.get("notes", "")
                }
                
                # Build reverse mapping: address -> cluster_id
                for addr in addresses:
                    self.address_to_cluster[addr] = cluster_id
                    self.all_scam_addresses.add(addr)
            
            print(f"✓ Loaded scam intelligence: {len(self.scam_wallets)} wallets, "
                  f"{len(self.scam_contracts)} contracts, {len(self.scam_clusters)} clusters")
                  
        except Exception as e:
            print(f"Error loading scam database: {e}")
            import traceback
            traceback.print_exc()

    def check_scam_intelligence(self, address: str) -> dict:
        """
        Check if address exists in scam intelligence database.
        Returns detailed metadata if matched.
        
        PHASE 1: Static Validation - Direct database lookup
        """
        addr_lower = address.lower()
        
        # Check wallets
        if addr_lower in self.scam_wallets:
            intel = self.scam_wallets[addr_lower]
            cluster_id = self.address_to_cluster.get(addr_lower)
            
            return {
                "scam_match": True,
                "scam_type": "wallet",
                "scam_category": intel["category"],
                "scam_source": intel["source"],
                "scam_confidence": intel["confidence"],
                "scam_notes": intel["notes"],
                "cluster_id": cluster_id,
                "cluster_info": self.scam_clusters.get(cluster_id) if cluster_id else None
            }
        
        # Check contracts
        if addr_lower in self.scam_contracts:
            intel = self.scam_contracts[addr_lower]
            cluster_id = self.address_to_cluster.get(addr_lower)
            
            return {
                "scam_match": True,
                "scam_type": "contract",
                "scam_category": intel["category"],
                "scam_source": intel["source"],
                "scam_confidence": intel["confidence"],
                "scam_notes": intel["notes"],
                "cluster_id": cluster_id,
                "cluster_info": self.scam_clusters.get(cluster_id) if cluster_id else None
            }
        
        # Check if address is in any cluster (but not explicitly listed)
        cluster_id = self.address_to_cluster.get(addr_lower)
        if cluster_id:
            cluster_info = self.scam_clusters.get(cluster_id, {})
            return {
                "scam_match": True,
                "scam_type": "cluster_member",
                "scam_category": "cluster_associated",
                "scam_source": cluster_info.get("source", "unknown"),
                "scam_confidence": cluster_info.get("confidence", 0.5),
                "scam_notes": cluster_info.get("notes", ""),
                "cluster_id": cluster_id,
                "cluster_info": cluster_info
            }
        
        # No match
        return {
            "scam_match": False,
            "scam_type": None,
            "scam_category": None,
            "scam_source": None,
            "scam_confidence": None,
            "scam_notes": None,
            "cluster_id": None,
            "cluster_info": None
        }

    def analyze_wallet_connections(self, wallet: str, recent_transfers: list) -> dict:
        """
        PHASE 3: Graph Risk Analysis
        
        Builds transaction graph and computes hop distance to scam addresses.
        Uses scam intelligence as seed nodes.
        """
        # Reset graph for this analysis
        self.graph.clear()
        
        wallet_lower = wallet.lower()
        self.graph.add_node(wallet_lower)
        
        # Build graph from recent transfers
        for tx in recent_transfers:
            frm = tx.get("from", "").lower()
            to = tx.get("to", "").lower()
            if frm and to:
                self.graph.add_edge(frm, to)
        
        # Find shortest path to any scam address (use as seed nodes)
        min_distance = float("inf")
        connected_to_scam = False
        nearest_scam_category = None
        nearest_scam_source = None
        
        # Check direct match first
        if wallet_lower in self.all_scam_addresses:
            min_distance = 0
            connected_to_scam = True
            
            # Get category from whichever dict contains it
            if wallet_lower in self.scam_wallets:
                nearest_scam_category = self.scam_wallets[wallet_lower]["category"]
                nearest_scam_source = self.scam_wallets[wallet_lower]["source"]
            elif wallet_lower in self.scam_contracts:
                nearest_scam_category = self.scam_contracts[wallet_lower]["category"]
                nearest_scam_source = self.scam_contracts[wallet_lower]["source"]
        else:
            # Check graph connections
            for node in self.graph.nodes():
                if node in self.all_scam_addresses:
                    try:
                        dist = nx.shortest_path_length(self.graph, source=wallet_lower, target=node)
                        if dist < min_distance:
                            min_distance = dist
                            connected_to_scam = True
                            
                            # Track nearest scam category
                            if node in self.scam_wallets:
                                nearest_scam_category = self.scam_wallets[node]["category"]
                                nearest_scam_source = self.scam_wallets[node]["source"]
                            elif node in self.scam_contracts:
                                nearest_scam_category = self.scam_contracts[node]["category"]
                                nearest_scam_source = self.scam_contracts[node]["source"]
                    except nx.NetworkXNoPath:
                        continue
        
        # Generate human-readable explanation
        explanation = self._generate_hop_explanation(min_distance, nearest_scam_category)
        
        return {
            "wallet_scam_distance": min_distance if min_distance != float("inf") else -1,
            "connected_to_scam_cluster": connected_to_scam,
            "nearest_scam_category": nearest_scam_category,
            "nearest_scam_source": nearest_scam_source,
            "graph_explanation": explanation
        }
    
    def _generate_hop_explanation(self, distance: float, category: str = None) -> str:
        """Generate plain English explanation for hop distance"""
        if distance == 0:
            return "Address is directly flagged in scam intelligence database"
        elif distance == 1:
            cat_str = f" ({category})" if category else ""
            return f"Address has directly interacted with known scam addresses{cat_str}"
        elif distance == 2:
            return "Address is 2 hops away from known scam activity (indirect exposure)"
        elif distance == 3:
            return "Distant connection to scam activity detected (3 hops)"
        elif distance > 3:
            return "Very distant or no meaningful connection to known scams"
        else:
            return "No connection to known scam addresses detected"

