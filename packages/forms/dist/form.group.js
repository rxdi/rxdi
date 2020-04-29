"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const form_tokens_1 = require("./form.tokens");
const rx_fake_1 = require("./rx-fake");
class FormGroup {
    constructor(value, errors) {
        this.validators = new Map();
        this.valid = true;
        this.invalid = false;
        this.errors = {};
        this.errorMap = new Map();
        this.inputs = new Map();
        this.options = {};
        this._valueChanges = new rx_fake_1.BehaviorSubject(value);
    }
    init() {
        this.setFormElement(this.querySelectForm(this.parentElement.shadowRoot || this.parentElement)).setInputs(this.mapEventToInputs(this.querySelectorAllInputs()));
    }
    prepareValues() {
        Object.keys(this.value).forEach(v => {
            const value = this.value[v];
            this.errors[v] = this.errors[v] || {};
            if (value.constructor === Array) {
                if (value[1] && value[1].constructor === Array) {
                    value[1].forEach(val => {
                        const oldValidators = this.validators.get(v) || [];
                        this.validators.set(v, [...oldValidators, val]);
                    });
                }
                if (value[0].constructor === String ||
                    value[0].constructor === Number ||
                    value[0].constructor === Boolean) {
                    this.value[v] = value[0];
                }
                else {
                    throw new Error(`Input value must be of type 'string', 'boolean' or 'number'`);
                }
            }
        });
        return this;
    }
    setParentElement(parent) {
        this.parentElement = parent;
        return this;
    }
    getParentElement() {
        return this.parentElement;
    }
    setOptions(options) {
        this.options = options;
        return this;
    }
    getOptions() {
        return this.options;
    }
    get valueChanges() {
        return this._valueChanges.asObservable();
    }
    updateValueAndValidity() {
        this.resetErrors();
        const inputs = this.querySelectorAllInputs()
            .map(i => {
            i.setCustomValidity('');
            this.setElementValidity(i);
            this.setElementDirty(i);
            return i;
        })
            .map(input => this.validate(input))
            .filter(e => e.errors.length);
        this.getParentElement().requestUpdate();
        return inputs;
    }
    updateValueAndValidityOnEvent(method) {
        const self = this;
        return function (event) {
            self.setElementDirty(this);
            const selector = `input[name="${this.name}"]`;
            const hasMultipleBindings = [
                ...self
                    .getFormElement()
                    .querySelectorAll(selector).values()
            ].length;
            let value = this.value;
            if (hasMultipleBindings === 1 &&
                (this.type === 'checkbox' || this.type === 'radio')) {
                value = String(this.checked);
            }
            if (this.type === 'number') {
                value = Number(value);
            }
            const inputsWithBindings = [
                ...(self.getFormElement().querySelectorAll(`input[name="${this.name}"]:checked`)).values()
            ];
            if (hasMultipleBindings > 1) {
                if (!self.options.multi && this.type === 'checkbox') {
                    value = inputsWithBindings.map(e => e.value);
                }
                if (self.options.multi) {
                    inputsWithBindings.forEach(el => (el.checked = false));
                    this.checked = true;
                }
            }
            self.resetErrors();
            const isValid = self.applyValidationContext(self.validate(this));
            if (self.options.strict) {
                if (isValid) {
                    self.setElementValidity(this, isValid);
                    self.setValue(this.name, value);
                }
                self.parentElement.requestUpdate();
                return method.call(self.parentElement, event);
            }
            self.setElementValidity(this, isValid);
            self.setValue(this.name, value);
            self.parentElement.requestUpdate();
            return method.call(self.parentElement, event);
        };
    }
    applyValidationContext({ errors, element }) {
        const form = this.getFormElement();
        if (errors.length) {
            this.invalid = form.invalid = true;
            this.valid = form.valid = false;
            return false;
        }
        else {
            this.errors[element.name] = {};
            this.invalid = form.invalid = false;
            this.valid = form.valid = true;
            return true;
        }
    }
    querySelectForm(shadowRoot) {
        const form = shadowRoot.querySelector(`form[name="${this.options.name}"]`);
        if (!form) {
            throw new Error(`Form element with name "${this.options.name}" not present inside ${this.getParentElement().outerHTML} component`);
        }
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        return form;
    }
    querySelectAll(name) {
        return [...this.form.querySelectorAll(name).values()];
    }
    querySelectorAllInputs() {
        return [
            ...this.querySelectAll('input'),
            ...this.querySelectAll('select'),
        ]
            .filter(el => this.isInputPresentOnStage(el))
            .filter(el => !!el.name);
    }
    mapEventToInputs(inputs = []) {
        return inputs.map((el) => {
            const strategy = `on${this.options.strategy}`;
            if (!el[strategy]) {
                el[strategy] = function () { };
            }
            const customAttributes = Object.keys(el.attributes)
                .map(k => el.attributes[k].name.startsWith('#') ? el.attributes[k] : null)
                .filter(i => !!i);
            if (customAttributes.length) {
                const attr = customAttributes.find(a => a.name.startsWith('#'));
                this.parentElement[attr.name.replace('#', '')] = el;
            }
            el.addEventListener('blur', () => {
                this.setElementDirty(el);
                this.parentElement.requestUpdate();
                this.setElementValidity(el);
            });
            el[strategy] = this.updateValueAndValidityOnEvent(el[strategy]);
            return el;
        });
    }
    setElementValidity(el, validity) {
        const isValid = validity || this.applyValidationContext(this.validate(el));
        el['valid'] = isValid;
        el['invalid'] = !isValid;
    }
    setElementDirty(input) {
        input['touched'] = true;
        input['dirty'] = true;
    }
    isInputPresentOnStage(input) {
        if (input.outerHTML === '<input type="submit" style="display: none;">') {
            return;
        }
        const isInputPresent = Object.keys(this.value).filter(v => v === input.name);
        if (!isInputPresent.length) {
            throw new Error(`Missing input element with name ${input.name} for form ${this.getFormElement().name}`);
        }
        return isInputPresent.length;
    }
    validate(element) {
        let errors = [];
        element.setCustomValidity('');
        if (!element.checkValidity()) {
            return {
                errors: errors.concat(Object.keys(form_tokens_1.InputValidityState)
                    .map(key => element.validity[key]
                    ? { key, message: element.validationMessage }
                    : null)
                    .filter(i => !!i)),
                element
            };
        }
        errors = this.mapInputErrors(element);
        if (!errors.length) {
            return { errors: [], element };
        }
        this.setFormValidity(false);
        element.setCustomValidity(errors[0].message);
        return { element, errors };
    }
    mapInputErrors(element) {
        return (this.validators.get(element.name) || [])
            .map(v => {
            this.errors[element.name] = this.errors[element.name] || {};
            const error = v.bind(this.getParentElement())(element);
            if (error && error.key) {
                this.errors[element.name][error.key] = error.message;
                this.errorMap.set(v, error.key);
                return { key: error.key, message: error.message };
            }
            else if (this.errorMap.has(v)) {
                delete this.errors[element.name][this.errorMap.get(v)];
            }
        })
            .filter(i => !!i);
    }
    get(name) {
        return this.inputs.get(name);
    }
    getError(inputName, errorKey) {
        return this.errors[inputName][errorKey];
    }
    hasError(inputName, errorKey) {
        return !!this.getError(inputName, errorKey);
    }
    reset() {
        this.form.reset();
        this.resetErrors();
        this.setFormValidity();
        this.inputs.clear();
    }
    setFormValidity(validity = true) {
        this.valid = validity;
        this.invalid = !validity;
    }
    resetErrors() {
        this.errors = Object.keys(this.errors).reduce((object, key) => {
            object[key] = {};
            return object;
        }, {});
        this.errorMap.clear();
    }
    get value() {
        return this._valueChanges.getValue();
    }
    set value(value) {
        this._valueChanges.next(value);
    }
    unsubscribe() {
        this.reset();
        this._valueChanges.unsubscribe();
    }
    getValue(name) {
        return this.value[name];
    }
    setValue(name, value) {
        const values = this.value;
        values[name] = value;
        this.value = values;
        return values;
    }
    setFormValue(value) {
        this.value = value;
    }
    setFormElement(form) {
        this.form = form;
        return this;
    }
    setInputs(inputs) {
        this.inputs = new Map(inputs.map(e => [e.name, e]));
    }
    getFormElement() {
        return this.form;
    }
}
exports.FormGroup = FormGroup;
