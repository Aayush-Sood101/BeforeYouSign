import networkx as nx
import json
import os

class GraphEngine:
    def __init__(self, scam_db_path="scam_db.json"):
        self.scam_db = set()
        self.scam_db_path = scam_db_path
        self._load_scam_database()
        self.graph = nx.Graph()

    def _load_scam_database(self):
        if os.path.exists(self.scam_db_path):
            with open(self.scam_db_path, "r") as f:
                scam_list = json.load(f)
                self.scam_db = set(addr.lower() for addr in scam_list)
        else:
            print(f"Warning: {self.scam_db_path} not found. Scam DB is empty.")

    def analyze_wallet_connections(self, wallet: str, recent_transfers: list) -> dict:
        """
        Builds a local graph from recent transfers and finds distance to known scam addresses.
        """
        # Reset graph for this analysis (or keep a persistent one if improved)
        self.graph.clear()
        
        wallet_lower = wallet.lower()
        self.graph.add_node(wallet_lower)
        
        # Build graph from transfers
        # Transfer format from Alchemy: { 'from': ..., 'to': ... }
        for tx in recent_transfers:
            frm = tx.get("from", "").lower()
            to = tx.get("to", "").lower()
            if frm and to:
                self.graph.add_edge(frm, to)
        
        # Find shortest path to any scam address
        min_distance = float("inf")
        connected_to_scam = False
        
        # Check if the wallet itself is a scammer
        if wallet_lower in self.scam_db:
             min_distance = 0
             connected_to_scam = True
        else:
            # Check connected nodes
            for node in self.graph.nodes():
                if node in self.scam_db:
                    try:
                        dist = nx.shortest_path_length(self.graph, source=wallet_lower, target=node)
                        if dist < min_distance:
                            min_distance = dist
                            connected_to_scam = True
                    except nx.NetworkXNoPath:
                        continue
        
        return {
            "wallet_scam_distance": min_distance if min_distance != float("inf") else -1,
            "connected_to_scam_cluster": connected_to_scam
        }
