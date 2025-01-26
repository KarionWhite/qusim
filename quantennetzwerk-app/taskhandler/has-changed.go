package taskhandler

import "encoding/json"

//Has Changed Variable with getter.
var hasChanged bool = false

func GetHasChanged() bool {
	return hasChanged
}

//Type for the task hasChanged
type has_Changed struct {
	HasChanged bool `json:"hasChanged"`
}

//Function to set the hasChanged variable
func SetHasChanged(data json.RawMessage) {
	var hasChangedData has_Changed
	err := json.Unmarshal(data, &hasChangedData)
	if err != nil {
		return
	}
	hasChanged = hasChangedData.HasChanged
}
