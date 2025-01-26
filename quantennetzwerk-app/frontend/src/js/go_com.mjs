
/**
 * Diese Funktion ruft eine Go-Funktion auf, die ein Promise zurückgibt.
 * Achte darauf das data.task gesetzt ist, da es als Parameter für die Go-Funktion verwendet wird.
 * @param {Object} data Das Objekt, das an die Go-Funktion übergeben wird 
 * @returns Promise als Objekt mit den Eigenschaften success und Data
 */
function go_post(data) {

    if (!check_request(data)) {
        console.error("Invalid request:", data);
        return Promise.resolve({ success: false, Data: "Invalid Request" });
    }
    return window.go.main.App.PostRequest(data) // Gib das Promise zurück
        .then((result) => {
            if (result && result.error) {
                console.error("Go-Error:", result.error);
                return { success: false, Data: result.error };
            }
            return JSON.parse(result);
        })
        .catch((error) => { // Optional: Behandle Fehler beim Aufruf von PostRequest
            console.error("Call Error:", error);
            return { success: false, Data: "Call error: " + error };
        });
    
}

/**
 * Diese Funktion ruft eine Go-Funktion auf, die ein JSON-Object zurückgibt.
 * Achte darauf das data.task gesetzt ist, da es als Parameter für die Go-Funktion verwendet wird.
 * @param {Object} data Das Objekt, das an die Go-Funktion übergeben wird
 * @returns JSON-Objekt mit den Eigenschaften success und Data
*/

function go_get(data) {
    if (!check_request(data)) {
        console.error("Invalid request:", data);
        return { success: false, Data: "Invalid Request" };
    }
    try {
        const result = window.go.main.App.GetRequest(data);
        return JSON.parse(result);
    } catch (error) {
        console.error("Error:", error);
        return { success: false, Data: error };
    }
}

/**
 * Diese Funktion ruft eine Go-Funktion auf, die eine Event-Funktion aufruft.
 * Achte darauf das data.task gesetzt ist, da es als Parameter für die Go-Funktion verwendet wird.
 * @param {Object} data Das Objekt, das an die Go-Funktion übergeben wird
 * @param {Function} event_func Die Funktion, die aufgerufen wird, wenn die Go-Funktion das Event auslöst
 * @returns void
    */
function go_post_event(data, event_func) {
    if (!check_request(data)) {
      console.error("Invalid request:", data);
      if (typeof event_func === "function") {
        event_func({ success: false, Data: "Invalid Request" });
      }
      return;
    }
  
    window.go.main.App.PostRequest(data)
      .then((result) => {
        let parsedResult;
        if (result && result.error) {
          console.error("Go-Error:", result.error);
          parsedResult = { success: false, Data: result.error };
        } else {
          parsedResult = JSON.parse(result);
        }
  
        if (typeof event_func === "function") {
          event_func(parsedResult);
        }
      })
      .catch((error) => {
        console.error("Call Error:", error);
        if (typeof event_func === "function") {
          event_func({ success: false, Data: "Call error: " + error });
        }
      });
  }

/**
 * Diese Funktion ruft eine Go-Funktion auf, die eine Event-Funktion aufruft.
 * Achte darauf das data.task gesetzt ist, da es als Parameter für die Go-Funktion verwendet wird.
 * @param {Object} data Das Objekt, das an die Go-Funktion übergeben wird
 * @param {Function} event_func Die Funktion, die aufgerufen wird, wenn die Go-Funktion das Event auslöst
 * @returns void
 */
function go_get_event(data, event_func) {
    if (!check_request(data)) {
      console.error("Invalid request:", data);
      if (typeof event_func === "function") {
        event_func({ success: false, Data: "Invalid Request" });
      }
      return;
    }
  
    try {
      const result = window.go.main.App.GetRequest(data);
      const parsedResult = JSON.parse(result);
      if (typeof event_func === "function") {
        event_func(parsedResult);
      }
    } catch (error) {
      console.error("Error:", error);
      if (typeof event_func === "function") {
        event_func({ success: false, Data: error });
      }
    }
}

// Hilfsfunktionen
function check_request(data) {
    if (typeof data !== "object" || data === null) return false;
    if (typeof data.task !== "string" || data.task.trim() === "") return false;
    // Hier weitere Prüfungen, falls nötig...
    return true;
}

export { go_post, go_get, go_post_event, go_get_event };