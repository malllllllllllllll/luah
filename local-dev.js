// local-dev.js
// When running on localhost, install a lightweight mock of the Supabase client
// so the app can be tested end-to-end without real keys or network.

(function () {
  try {
    const host = location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return;

    console.info("Luah: running in local mock mode (localhost)");

    const mockVents = [];
    const mockComments = [];
    let ventId = 1;
    let commentId = 1;

    function nowISO() {
      return new Date().toISOString();
    }

    function createMockClient() {
      return {
        from(table) {
          return new MockQuery(table);
        }
      };
    }

    function MockQuery(table) {
      this.table = table;
      this._filters = [];
      this._order = null;
      this._insertPayload = null;
    }

    MockQuery.prototype.eq = function (col, val) {
      this._filters.push({ type: "eq", col, val });
      return this;
    };

    MockQuery.prototype.order = function (col, opts) {
      this._order = { col, opts };
      return this;
    };

    MockQuery.prototype.select = function () {
      let data = [];
      if (this.table === "vents") {
        data = mockVents.slice().sort((a, b) =>
          a.created_at < b.created_at ? 1 : -1
        );
      }
      if (this.table === "vent_comments") {
        data = mockComments.slice().sort((a, b) =>
          a.created_at > b.created_at ? 1 : -1
        );
      }

      this._filters.forEach((f) => {
        if (f.type === "eq") {
          data = data.filter((r) => String(r[f.col]) === String(f.val));
        }
      });

      return Promise.resolve({ data, error: null });
    };

    MockQuery.prototype.insert = function (payload) {
      this._insertPayload = payload;
      return this;
    };

    MockQuery.prototype.single = function () {
      if (this.table === "vents") {
        const payload = this._insertPayload || {};
        const record = {
          id: ventId++,
          text: payload.text || "",
          mood: payload.mood || "Uncategorized",
          created_at: nowISO()
        };
        mockVents.unshift(record);
        return Promise.resolve({ data: record, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    };

    // handle insert for comments
    MockQuery.prototype.then = function (resolve) {
      if (this.table === "vent_comments" && this._insertPayload) {
        const payload = this._insertPayload;
        const rec = {
          id: commentId++,
          vent_id: payload.vent_id,
          text: payload.text,
          created_at: nowISO()
        };
        mockComments.push(rec);
        return Promise.resolve({ data: rec, error: null }).then(resolve);
      }
      return Promise.resolve({ data: null, error: null }).then(resolve);
    };

    window.supabase = window.supabase || {};
    window.supabase.createClient = function () {
      return createMockClient();
    };
  } catch (e) {
    console.error("local-dev mock init failed", e);
  }
})();
