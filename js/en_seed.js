/* ============================================================
   PlayCARD v2 · 种子数据英文版（AI 商业语境翻译，非直译）
   与 data.js 中文种子合并为双语结构
   ============================================================ */
window.PlayCARD_SEED_EN = {
 "northstar": "Turn channel data into KEHU's proprietary asset, enabling the company to charge for decisions and outcomes rather than licenses and person-days.",
 "alloc_source": "Three Redmine exports (Core, SaaS Apps, Platform Apps, ~10,100 records since 2019), attributed to engine dimensions by assignee and sprint; unassigned items go to legacy work. This row is the focus of this table.",
 "bets": [
  {
   "id": "B-01",
   "claim": "Channel endpoint data can be priced and sold independently of software",
   "basis": [
    "Two brands expressed verbal purchase intent, conditional on data being purchasable independently of software (2026-07)",
    "Industry trend shifting toward inventory reduction and sell-through; bottle-open rate rising as a board-level metric"
   ],
   "kill_t": "After formally quoting three clients, none entered commercial negotiations",
   "sacrifice": "No longer accept contracts that fully transfer data ownership. Estimated ~20% of new signings will fail to close due to this.",
   "probe_a": "Create a standalone data subscription quote and formally send it to three clients",
   "crit_m": "Number of clients entering commercial negotiations after quoting",
   "crit_u": "clients",
   "crit_src": "Sales-side registration",
   "mbt": [
    {
     "t": "Contractually obtain de-identified aggregated usage rights"
    },
    {
     "t": "Data coverage density sufficient for clients to use as a benchmark"
    },
    {
     "t": "Clients have a budget line item for 'data'"
    },
    {
     "t": "Marginal cost of collection is lower than subscription revenue"
    }
   ],
   "short_by": "Chris",
   "short_q": "2026 Q3",
   "short_arg": "Brands are more likely to build their own collection teams, or third parties will offer equivalent coverage at lower prices. Data alone is hard to price independently and will end up as a giveaway with the software.",
   "sigs": [
    {
     "t": "A client's marketing department has started building an in-house field visit team with 6 headcount",
     "by": "BDA team"
    }
   ],
   "rv": [
    {
     "t": "Clause template finalized, but sales is hesitant to use it. This quarter, make it a mandatory item for signing.",
     "by": "Vince"
    }
   ]
  },
  {
   "id": "B-02",
   "claim": "One person, with agent assistance, can manage an account end-to-end without quality degradation",
   "basis": [
    "First pilot account: average 11 days from requirement to launch vs. 19 days for control group",
    "Own ~10,100 requirement-config-test triplets can serve as training corpus for delivery agent"
   ],
   "kill_t": "Pilot defect rate higher than control group for two consecutive quarters, or client requests in writing to revert to multi-point contact",
   "sacrifice": "Disband the handoff role between requirements and implementation; stop quoting on a person-day basis. Short-term implementation revenue will decline, and some senior colleagues' roles will disappear.",
   "probe_a": "Convert the implementation portion of a renewal contract to a fixed package price and see if the client signs",
   "crit_m": "Number of contracts signed with fixed package price",
   "crit_u": "contracts",
   "crit_src": "Sales-side registration",
   "mbt": [
    {
     "t": "Pricing can migrate in sync with efficiency gains"
    },
    {
     "t": "Clients accept a single point of contact"
    },
    {
     "t": "Delivery quality does not depend on cross-review"
    },
    {
     "t": "Key talent does not churn"
    }
   ],
   "short_by": "Thomas",
   "short_q": "2026 Q3",
   "short_arg": "Efficiency gains will arrive before new pricing. During that period, we'd be charging by person-day but using half the person-days, effectively cutting our own revenue. Also, one person per account ties delivery quality to individual performance; a single departure becomes a client-level loss.",
   "sigs": [
    {
     "t": "Client's commercial side accepts outcome-based fees but requires a cap, squeezing actual profit potential",
     "by": "Vince"
    },
    {
     "t": "Pilot client requests to keep a second point of contact",
     "by": "Implementation team"
    }
   ],
   "rv": [
    {
     "t": "Quality is currently maintained. Talent concentration risk is mitigated by the platform's rule engine; no additional headcount.",
     "by": "Vince"
    },
    {
     "t": "Originally betting on speed, now betting on quality not declining. Speed was never the client's pain point.",
     "by": "Vince"
    }
   ]
  },
  {
   "id": "B-03",
   "claim": "After opening configuration capabilities to agents, clients can modify processes in natural language without incidents",
   "basis": [
    "No-code delivery already accounts for 18% of change requests, with Business Rule and Layout being the majority"
   ],
   "kill_t": "Agent-configured versions of five real changes have UAT defect rate 50% higher than manual versions",
   "sacrifice": "Stop writing custom code for individual clients. In the short term, we will lose some clients with strong customization needs and upset a few clients accustomed to on-demand support.",
   "probe_a": "Select five real change requests, complete all with agent configuration only, and compare defect rates with manual versions",
   "crit_m": "Defect rate multiple of agent-configured versions relative to manual",
   "crit_u": "x",
   "crit_src": "UAT records, lower is better",
   "mbt": [
    {
     "t": "Agent configuration defect rate not higher than manual"
    },
    {
     "t": "Permissions and data isolation cannot be bypassed at the configuration layer"
    },
    {
     "t": "Corpus annotation speed keeps up"
    },
    {
     "t": "Clients are willing to modify processes themselves"
    }
   ],
   "short_by": "Vince",
   "short_q": "2026 Q3",
   "short_arg": "Clients don't actually want to modify processes themselves; they buy the software to avoid that. Opening configuration just pushes maintenance responsibility to clients and expands the incident surface.",
   "sigs": [],
   "rv": [
    {
     "t": "Originally planned to expand Hook first, but changed to prioritize Object Type and permission model for broader coverage.",
     "by": "Chris"
    }
   ]
  },
  {
   "id": "B-04",
   "claim": "Within three years, data- and outcome-based revenue will account for more than half of total revenue",
   "basis": [
    "Management consensus"
   ],
   "kill_t": "",
   "sacrifice": "",
   "probe_a": "",
   "crit_m": "Share of data- and outcome-based revenue",
   "crit_u": "%",
   "crit_src": "Financial reporting",
   "mbt": [
    {
     "t": "All three previous bets hold true"
    }
   ],
   "short_by": "Not assigned",
   "short_q": "2026 Q3",
   "short_arg": "",
   "sigs": [],
   "rv": []
  }
 ]
};
